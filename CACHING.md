# Marketplace caching and synchronization

Implemented on 15 November 2026. No packages were installed or updated. This extends the existing `useResource` API and uses the installed Expo SDK 58 SecureStore and Image modules. No runtime fixtures or demo features were added.

## Architecture and audit

Previously, `useResource` kept each screen's response in its own React state. Mounting another instance issued another GET; manual refresh changed the key and hid the old response. Seller status had a separate five-minute memory cache. Catalogue search already had a 350 ms debounce, and checkout/product saves already used backend transactions and idempotency keys.

`lib/query-cache.ts` now owns all server query snapshots. `useResource`, `useSellerAccount` and `useSellerInventory` subscribe to this shared store. The former seller-only cache factory was removed; its response validator remains. Query keys include a canonical path with sorted parameters and either a public namespace or the authenticated UID. Store/product IDs, filters and page cursors remain in the path. Empty parameters and the legacy order `updated` cache buster are removed; text searches are normalized.

The cache provides shared in-flight requests, stale-while-revalidate, explicit invalidation, cancellation, unchanged-response identity preservation, and up to two retries for transient GET failures. Retry delays start at 500 ms and double with jitter. Failed reads have a 30-second automatic retry cooldown; explicit Retry bypasses it. Mutations are never automatically retried by this cache.

Every query now uses saved data until an explicit refresh, known invalidation or cache miss. There are no age-based expiry or freshness checks, including on application and order screens. `canReuseSnapshot` requires data plus a non-null update timestamp; invalidation clears the timestamp. A failed manual refresh retains usable data and does not create a retry loop on navigation/resume. Only focused screens count as active readers. Foreground/reconnection repairs missing or invalidated active queries, without probing connectivity just because the app resumed. Explicit refresh, Check status, conflict reload and permission-rejection invalidation can request current data. Upload/save/checkout endpoints enforce current server state. Backgrounding cancels requests and flushes changed snapshots. Obsolete searches are aborted once their last focused consumer leaves, with a brief grace period for remounts. There are no closed-app background jobs, polling timers or push/WebSocket integrations.

## Strategies

| Data | Reuse policy | Behaviour |
| --- | --- | --- |
| Product categories | App configuration | Existing bundled categories require no API read. |
| Catalogue/search pages | Until refresh, invalidation or eviction | Shared public cache, 350 ms search debounce, backend-ordered newest/price sort, cursor pages and server-derived seller verification. A new search/page can require a first read. |
| Public product details | Until refresh, invalidation or eviction | Fetch starts on a completed product tap, never merely touching a card while scrolling; checkout rechecks authoritative stock/prices. |
| Public storefront | Until refresh, invalidation or eviction | Cached metadata and newest/price-sorted cursor pages; cached cards stay mounted during refresh. |
| Seller application/account status | Until Check status, refresh, invalidation or eviction | Opening Account/application/Add product reuses saved status. Backend permissions are enforced on uploads/saves. |
| Seller inventory/settings/owned product | Until refresh, invalidation or eviction | My Store requests 24 seller-owned products per cursor page and fetches more only on request. Loaded inventory pages can populate owned-product details without another GET. Successful writes update cached records. Explicit conflict reload fetches current details. |
| Orders | Until refresh, invalidation or eviction, including empty/active lists | Pull to refresh discovers new orders and external status updates. Payment/status actions validate against current orders on the backend. |
| Customer identity | Existing encrypted auth session | No new profile endpoint reads were introduced. |
| Marketplace config | Until refresh, invalidation or eviction | Server still decides whether an order/fulfilment action is allowed. |
| Resolved operating-area labels | Until refresh, invalidation or eviction | Reused across screens; no lookup is needed when a record already supplies a label. |
| Basket | Immediate local state | Encrypted, debounced device persistence; guest and UID-specific baskets are separate, with no server cart endpoint or per-quantity API writes. Compatible guest baskets merge on sign-in; different-store baskets remain switchable and are not discarded. |
| Images | Native memory/disk image cache | Uses installed `expo-image`; versioned URLs identify changed assets. |

Product reviews now use an authenticated, order-verified API and public per-product summaries/recent reviews. Favorite lists and a notification inbox still have no corresponding marketplace APIs; no simulated versions or caches were introduced for them. My Store offers Move to draft and Delete product. Confirmed draft/deletion responses remove the listing from cached lists and details without invalidating those entire lists. Existing product edits patch matching rows or remove rows that no longer match a search/category. A newly matching published listing invalidates the relevant lists so server pagination remains authoritative; unrelated categories/storefronts remain cached. Partial changes preserve the original list timestamp. Order-driven stock changes still invalidate affected stock snapshots because an order response does not supply current product stock. Existing orders and unrelated product details remain cached.

## Persistence and bounds

`query-persistence.ts` reuses the existing serialized, two-slot chunked SecureStore utility. Public and private snapshots each have a 30,000-character budget. Seller status and configuration get priority, then complete recent snapshots that fit are saved; oversized responses are omitted rather than truncated. Writes are coalesced for ten seconds, flushed on backgrounding and skipped if unchanged. There are no server writes or device writes just for reading a cache entry.

Encrypted private persistence includes the UID and schema version. Switching accounts or signing out immediately drops protected memory snapshots and schedules deletion of the protected disk namespace. Old in-flight results cannot restore that account's data. Token refresh for the same UID preserves cache identity. Public entries survive account switches.

Confirmed application, store and product changes update the shared snapshots without a follow-up GET. Order placement/cancellation invalidates stock-dependent snapshots. Preparing, ready and payment updates update loaded orders without invalidating catalogue/inventory stock that has not changed. A staff approval made on another device appears after Check status or explicit refresh; opening the screen alone does not fetch. There is no push invalidation. Cached seller status is display data: uploading/saving products, editing a store and changing orders require backend ownership/status validation, and checkout checks prices and stock transactionally.

Public/private snapshots do not expire by age. Incompatible, wrong-scope and future-dated persisted records are ignored; account changes still clear private data. Saved data never grants authorization. The memory collector targets at most 60 entries and approximately 1.5 MB of serialized payload, evicting unobserved inactive entries only when a budget is exceeded. Currently observed queries are retained; very large active responses can exceed that target. Cache eviction, missing storage or an oversized snapshot can still require a fetch. Existing valid older snapshots restore without migration or a forced refetch.

The basket has its own encrypted documents because it contains local user intent, not a duplicate server-query cache. A guest document is separate from each UID-specific signed-in document; account switches cannot hydrate another account's cart. It stores compact product snapshots, quantities and any unresolved order attempt. Photos/descriptions are omitted from basket persistence to keep storage small. Basket changes coalesce for 500 ms and flush on backgrounding. On sign-in, same-store guest/account lines merge; if the stores differ, both baskets remain available through an explicit switch. There is no cross-device basket synchronization.

An order's key and exact body are written before the first POST. Uncertain results retain this pair across restarts and lock basket edits; Retry resends the same request. A confirmed result clears it. Definite first-attempt validation/conflict rejection permits edits. No checkout, payment or high-risk mutation is queued for automatic offline execution.

## UI, images and feedback

Home and storefront use virtualized two-column lists, 24-record cursor pages and explicit Load more. My Store fetches 24 seller-owned products per request and offers explicit Load more; its product search and counts cover only products loaded so far. Buyer order cards are also virtualized. Catalogue first loads have a card skeleton; previously loaded results stay visible during refresh. Generic resource states show a saved-data timestamp after a refresh error. Seller status shows a skeleton only without cached data. Stale background checks keep the existing status visible without a spinner; the compact indicator and header spinner appear only for an explicit refresh. `useResource.refreshing` tracks that user action separately from its shared query's `loading` state.

`MarketImage` uses Expo Image memory/disk caching, a neutral loading background, recycling keys and a short transition. Catalogue thumbnails request a 480px Cloudinary variant, inventory thumbnails 240px, and product galleries 960px, with automatic quality/format. Other image hosts and signed Cloudinary URLs are preserved. Native image cache eviction is managed by the platform library. Account avatars retain their existing initials/error fallback.

`lib/toast.ts` and `ToastHost` provide success/error/warning/info feedback with safe-area placement, light/dark colours, dismissal, a maximum of three messages and duplicate suppression. Successes last four seconds; errors last 6.5 seconds. Confirmed sign-in/out, application submission, store/product saves, cart additions/removals, basket price refreshes, order placement/status/payment acknowledgement and reports provide feedback. Action failures and explicit refresh failures show errors; field validation stays inline. Routine background reads do not toast. The former seller-specific floating notice is no longer mounted.

Reachability is based on actual API success/failure rather than Wi-Fi status. A small saved-data indicator appears after network failure. There are no automatic connectivity probes, including on offline resume. Tapping Retry makes one shared config request, saves its result and repairs missing/invalidated active queries. A disconnect is detected on the next failed request rather than instantly when the radio changes.

## Backend changes and deployment

`CatalogReadCache` holds only public published-product query results, with a ten-second TTL, in-flight deduplication, cloned results, at most 64 entries and a 2 MB payload budget. Results larger than 256 KB are not cached. It lives inside `FirestoreMarketplaceRepository` and invalidates after committed product/store transactions, including checkout stock changes. A result begun before invalidation cannot repopulate the cache. Private queries, direct record reads, seller permissions, store visibility and transactions bypass it.

Catalogue pages query publication/category/store filters before applying a document-ID cursor, fetching at most 25 records to return 24 plus a next cursor. Only stores referenced by returned products are read, once per store per request. This removes the former global 100-store scan and its visibility cap. Store status is deliberately re-read even when product results are cached, so suspension is not hidden by the server cache. Text search still filters each scanned page; an empty page with a cursor can be followed with Load more. This is not a full-text search index.

The new client opts into paging using `page=1`; existing unpaged catalogue/store consumers retain the previous response behaviour. Paginated catalogue and storefront requests accept `sort=newest`, `sort=price-low` or `sort=price-high`; cursor tokens include the selected order and the last product's sort field/document ID. New clients opt into server-derived seller verification with `includeStoreVerification=1`; new stores persist the status at approval, while older stores fall back to their application record in a batched read. This opt-in also keeps existing cached product pages separate from responses containing seller verification. Firestore indexes for these sort/category/store combinations and the product-review feed are in `firestore.indexes.json`. Existing private routes continue returning `Cache-Control: private, no-store`. Public paginated responses use no-store at the HTTP layer; the application owns freshness.

Deploy the companion backend and the new `shopyethu_products` sort indexes plus the `shopyethu_reviews` product/date index in `chefu-inc-backend/firestore.indexes.json` before releasing the mobile update. Indexes were added locally, not deployed. A missing index will surface as a retryable server failure. Checkout still validates current price, stock, store status and fulfilment transactionally. Seller mutations still validate current ownership and permissions. Payment success is never inferred from cached data.

This server cache is per instance. Writes handled on another API instance may leave public product snapshots stale for up to ten seconds; uncached checkout and visibility checks remain authoritative. A shared invalidation system is a follow-up only if this brief public staleness is unsuitable. Redis already used for security limits was not coupled to catalogue data.

## Verification

Automated coverage lives in `tests/query-cache.test.mjs`, `cache-integration.test.mjs` and `seller-account-cache.test.mjs`; run `npm run test:cache`. The GitHub Android workflow now runs it. Backend coverage is in `catalog-cache.spec.ts` plus existing marketplace tests.

Measured in controlled request-counter tests, not a production or Android timing benchmark:

| Scenario | Previous audited behaviour | New measured result |
| --- | --- | --- |
| Three consumers and twenty repeat visits before staleness | Independent mounts could issue 23 GETs | 1 GET |
| Repeat screen visits after 90–100 days | Age-based revalidation | 0 additional GETs while snapshots remain saved |
| Fresh public/account snapshots restored from storage | No general persisted cache | 0 GETs in restore test |
| Confirmed application/store/product/order updates | Seller order update explicitly refetched | 0 follow-up GETs in mutation bridge test |
| Concurrent/repeated backend public product page reads | A query per invocation | 1 database page read inside the cache TTL |

Tests cover transient backoff, explicit retry, saved content, cancellation, garbage collection, disk budgets, schema/future-timestamp rejection, account isolation, late responses after logout, in-flight invalidation, confirmed-write precedence, basket hydration, durable order keys, duplicate toasts and offline token refresh retaining the account. Existing backend tests cover authoritative prices/stock, concurrent buyers, ownership, suspension, transaction retries and idempotency. No optimistic server edits were added, so no server-edit rollback flow is claimed.

The 17 November cache-first audit verifies 90–100 days of repeat catalogue/detail/inventory/account/order visits with no new GETs, restart with 90-day-old saved status, explicit Check status revealing backend approval, zero offline-resume probes, inventory-to-editor reuse, zero requests from cancelled product-card touches, and no list refetch after a confirmed price edit/draft/deletion. Unchanged storefront saves are disabled and guarded before transport, ignoring resolved labels/autocomplete tokens and normalized whitespace. `npm run test:cache` passes 44 tests; `npm run test:seller` passes 10 tests.

Remaining requests are deliberate: missing/evicted reads, relevant invalidation, explicit refresh/retry/Check status, debounced location searches while typing, uploads and confirmed user mutations. OAuth user information is fetched at sign-in, and token refresh happens only when an API request needs an expiring token. There is no separate profile request on routine screen visits. Checkout rechecks prices/stock in its POST transaction without a mandatory preliminary GET. Changes made by another account/device, new listings/orders and admin decisions appear on explicit refresh or Check status; this app has no push invalidation.

Android typecheck, lint, unit tests and Hermes export were run; backend typecheck, build and marketplace tests were run. See `VERIFICATION.md` for final counts and device status. No emulator/device is currently connected (`adb devices` returns an empty list), so Android visual performance, radio reconnection, slow-device behaviour and the live buyer/seller flow remain unverified. No frame rate or screen-load timing improvement is claimed.

Admin queues and order queries still retain their existing 100-record caps. Seller inventory now uses owner-filtered cursor pages; the app rejects a paginated inventory response from an older backend that omits its cursor. There is no real-time cross-device push invalidation. Abrupt process termination can lose basket edits within the 500 ms debounce or recent cache changes within ten seconds; an order request is never sent before its durable attempt is written.

## Files for this change

- Shared reads: `src/lib/query-cache.ts`, `query-policy.ts`, `query-persistence.ts`, `market-cache.ts`; `src/hooks/use-resource.ts`, `use-seller-account.ts`, `use-seller-inventory.ts`, `use-product-feed.ts`; `src/lib/seller-account.ts` and the remaining validator in `seller-account-cache.ts`.
- Transport, identity and basket: `src/lib/api.ts`, `api-events.ts`, `network-state.ts`, `session.ts`, `auth.tsx`, `cart-store.ts`, `cart.tsx`.
- Feedback and resources: `src/lib/toast.ts`, `src/components/feedback/ToastHost.tsx`, `MarketplaceSync.tsx`, `src/app/_layout.tsx`, `src/components/account/AccountScreen.tsx`, and resource-state handling now exported through `src/components/market/Primitives.tsx`.
- Lists/images/actions: Home, storefront, product, basket, buyer/seller orders, report and store editor screens; `ProductCard.tsx`, `MarketImage.tsx`, `ListPage.tsx`, `CatalogSkeleton.tsx`, seller `InventoryRow.tsx`/`ProductPhotos.tsx`, and `use-product-editor.ts`.
- Verification: `tests/query-cache.test.mjs`, `cache-integration.test.mjs`, `load-ts.mjs`, `seller-account-cache.test.mjs`, `package.json`, `.github/workflows/android-debug.yml`, `README.md`, `VERIFICATION.md` and this document.
- Backend: `src/modules/shopyethu/catalog-read-cache.ts`, `catalog-cache.spec.ts`, `catalog.service.ts`, `marketplace.repository.ts`, `marketplace.types.ts`, `marketplace.controller.ts`, `firestore.indexes.json`; the approval-email test assertion was aligned with the configured template alias.

Other concurrent UI, product-editor and collection-payment changes in the workspace were preserved. This inventory describes cache-related edits rather than attributing all staged workspace changes to this task.
