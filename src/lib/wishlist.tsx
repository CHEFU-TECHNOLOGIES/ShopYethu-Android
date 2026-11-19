import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useSyncExternalStore,
    type ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "@/lib/auth";
import { createApplicationDraftStore } from "@/lib/application-draft-store";
import { toast } from "@/lib/toast";
import { createWishlistStore } from "@/lib/wishlist-store";

const wishlist = createWishlistStore(createApplicationDraftStore(SecureStore));

type Wishlist = {
    productIds: string[];
    ready: boolean;
    saving: boolean;
    error: string;
    toggle: (productId: string) => Promise<void>;
    retry: () => void;
};

const Context = createContext<Wishlist | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
    const { session, ready: authReady } = useAuth();
    const uid = session?.user.uid ?? null;
    const state = useSyncExternalStore(
        wishlist.subscribe,
        wishlist.get,
        wishlist.get,
    );

    useEffect(() => {
        if (authReady) void wishlist.activate(uid);
    }, [authReady, uid]);

    const toggle = useCallback(async (productId: string) => {
        try {
            const added = await wishlist.toggle(productId);
            toast.success(
                added ? "Added to your wishlist." : "Removed from your wishlist.",
            );
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Could not update your wishlist.",
            );
        }
    }, []);

    const retry = useCallback(() => {
        if (authReady) void wishlist.activate(uid);
    }, [authReady, uid]);

    const matchesAccount = state.uid === uid;
    return (
        <Context.Provider
            value={{
                productIds: matchesAccount ? state.productIds : [],
                ready: matchesAccount && state.ready,
                saving: matchesAccount && state.saving,
                error: matchesAccount ? state.error : "",
                toggle,
                retry,
            }}
        >
            {children}
        </Context.Provider>
    );
}

export function useWishlist() {
    const value = useContext(Context);
    if (!value) throw new Error("WishlistProvider is required.");
    return value;
}
