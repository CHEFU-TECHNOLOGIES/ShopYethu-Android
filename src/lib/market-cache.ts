import * as SecureStore from "expo-secure-store";
import { api, ApiError } from "./api";
import { currentSession, subscribe } from "./session";
import { createQueryCache } from "./query-cache";
import { createQueryPersistence } from "./query-persistence";
import { createApplicationDraftStore } from "./application-draft-store";
import { canonicalPath, publicQuery } from "./query-policy";
import { onApiMutation, onApiRejection } from "./api-events";
import { toast, toastStore } from "./toast";
import { readSellerAccount } from "./seller-account-cache";
import { reuseOwnedProduct } from "./query-reuse";
import {
    cacheDeletedProduct,
    cacheSavedProduct,
    cacheSavedStore,
    invalidateOrderStock,
} from "./market-cache-updates";
import {
    hasSellerInventoryPageShape,
    isSellerInventoryPageRequest,
    isSellerInventoryPath,
    SELLER_INVENTORY_PATH,
} from "./marketplace-paths";
import type {
    DeletedProduct,
    Order,
    Product,
    SellerAccount,
    SellerApplication,
    SellerInventory,
    Storefront,
} from "@/types/marketplace";

export const marketCache = createQueryCache(async (path, signal, scope) => {
    if (scope !== "public" && currentSession()?.user.uid !== scope)
        throw new ApiError("Please sign in again.", 401);
    const data = await api(path, { signal });
    if (scope !== "public" && currentSession()?.user.uid !== scope)
        throw new ApiError("Your account changed. Please retry.", 401);
    if (
        isSellerInventoryPageRequest(path) &&
        !hasSellerInventoryPageShape(data)
    ) {
        throw new ApiError(
            "Seller inventory pagination is not available on the server yet. Please try again after the marketplace is updated.",
            503,
        );
    }
    return path === "/me"
        ? readSellerAccount(data, currentSession()!.user.uid)
        : data;
});
const persistence = createQueryPersistence(
    marketCache,
    createApplicationDraftStore(SecureStore),
);
let identity: string | null = null;
export function activateMarketCache(uid: string | null) {
    if (identity !== uid) {
        marketCache.clearPrivate();
        toastStore.clear();
        identity = uid;
    }
    return persistence.activate(uid);
}
subscribe((session) => {
    void activateMarketCache(session?.user.uid || null);
});
export function queryScope(path: string, uid: string | null) {
    return publicQuery(path) ? "public" : uid || "guest";
}
export async function loadMarketQuery(
    path: string,
    scope: string,
    force = false,
) {
    await activateMarketCache(currentSession()?.user.uid || null);
    if (scope !== "public" && scope !== identity) return;
    const canonical = canonicalPath(path);
    if (!force) reuseOwnedProduct(marketCache, canonical, scope);
    return marketCache.load(canonical, scope, force);
}
export const flushMarketCache = () => persistence.flush();
export function prefetchProduct(id: string) {
    void loadMarketQuery(`/products/${encodeURIComponent(id)}`, "public");
}
onApiRejection((rejectedPath) => {
    marketCache.invalidate(
        (path) => path.startsWith("/seller") && path !== rejectedPath,
        true,
    );
    if (rejectedPath !== "/me")
        marketCache.invalidate((path) => path === "/me");
});
function updateOrder(path: string, uid: string, order: Order) {
    marketCache.set<{ orders: Order[] }>(
        path,
        uid,
        (current) => ({
            orders: [
                order,
                ...current.orders.filter((item) => item.id !== order.id),
            ],
        }),
        false,
    );
}
// Reuse confirmed mutation responses; mark dependent snapshots stale without erasing them.
onApiMutation(({ path, data }) => {
    const uid = currentSession()?.user.uid;
    if (!uid) return;
    if (/^\/products\/[^/]+\/reviews$/.test(path)) {
        toast.success("Your verified product review was submitted.");
        const productPath = path.slice(0, -"/reviews".length);
        marketCache.invalidate(
            (queryPath, scope) =>
                scope === "public" &&
                (queryPath === path ||
                    queryPath.split("?")[0] === productPath ||
                    queryPath.split("?")[0] === "/products"),
            true,
        );
    } else if (path === "/application") {
        toast.success("Your seller application was submitted.");
        marketCache.set<SellerAccount>(
            "/me",
            uid,
            (current) => ({
                ...current,
                application: data as SellerApplication,
            }),
            false,
        );
    } else if (path === "/seller/store") {
        toast.success("Store details updated.");
        const store = data as Storefront;
        marketCache.set<SellerAccount>(
            "/me",
            uid,
            (current) => ({ ...current, store }),
            false,
        );
        marketCache.patch<SellerInventory>(
            (inventoryPath, scope) =>
                scope === uid && isSellerInventoryPath(inventoryPath),
            (current) => ({ ...current, store }),
        );
        cacheSavedStore(marketCache, store);
    } else if (path === "/seller/store/status") {
        const store = data as Storefront;
        toast.success(
            store.sellerPaused
                ? "Your store is paused."
                : "Your store is live again.",
        );
        marketCache.set<SellerAccount>(
            "/me",
            uid,
            (current) => ({ ...current, store }),
            false,
        );
        marketCache.patch<SellerInventory>(
            (inventoryPath, scope) =>
                scope === uid && isSellerInventoryPath(inventoryPath),
            (current) => ({ ...current, store }),
        );
        marketCache.invalidate(
            (queryPath, scope) =>
                scope === "public" &&
                (queryPath.split("?")[0] === "/products" ||
                    queryPath.startsWith("/products/") ||
                    queryPath.startsWith("/stores/")),
            true,
        );
    } else if (/^\/seller\/products(?:\/|$)/.test(path)) {
        if ((data as DeletedProduct).deleted === true) {
            cacheDeletedProduct(marketCache, uid, data as DeletedProduct);
            toast.success("Product deleted.");
            return;
        }
        const product = data as Product;
        toast.success(
            path.endsWith("/draft")
                ? "Product moved to drafts."
                : product.published
                  ? "Your product is published."
                  : "Draft saved.",
        );
        marketCache.patch<SellerInventory>(
            (inventoryPath, scope) =>
                scope === uid && isSellerInventoryPath(inventoryPath),
            (current, inventoryPath) => {
                if (current.products.some((item) => item.id === product.id)) {
                    return {
                        ...current,
                        products: current.products.map((item) =>
                            item.id === product.id ? product : item,
                        ),
                    };
                }
                return inventoryPath === SELLER_INVENTORY_PATH
                    ? { ...current, products: [product, ...current.products] }
                    : current;
            },
        );
        cacheSavedProduct(marketCache, uid, product);
    } else if (path === "/orders" || path.startsWith("/seller/orders/")) {
        toast.success(
            path === "/orders"
                ? "Order placed. Payment is due on collection."
                : path.endsWith("/payment")
                  ? "Payment confirmed as received."
                  : "Order status updated.",
        );
        const order = data as Order;
        if (order.buyerUid === uid) updateOrder("/orders", uid, order);
        if (order.sellerUid === uid) updateOrder("/seller/orders", uid, order);
        if (path === "/orders" || order.status === "cancelled") {
            invalidateOrderStock(marketCache, uid, order);
        }
    } else if (path === "/reports") toast.success("Your report was received.");
});
