# ShopYethu Performance and Cost Optimization Report

## Executive summary

This audit covered the ShopYethu Expo Android client and NestJS/Firestore backend. It found an existing client-side query cache with request deduplication, persistence, scoped data, freshness policies, and targeted invalidation, plus a bounded 10-second server cache for public product queries. Most writes and external-provider calls are user-triggered or needed for correctness; no polling loop or marketplace WebSocket workload was found in the inspected paths.

Two targeted improvements were made:

1. Operating-area label reads now use the shared client resource cache, so multiple components and repeated visits can reuse the same public place lookup.
2. Catalogue visibility checks now batch unique store document references through Firestore `getAll`, reducing per-store repository calls while still checking current store status on every catalogue response.

These changes are verified by unit tests and builds. They do **not** establish production latency, infrastructure, or monetary savings. In particular, Firestore still bills for each document read in a batch.

## Scope and evidence labels

- **Measured** means observed by a repeatable local test or build.
- **Estimated** means a code-path comparison, not a production measurement.
- **Not Yet Measured** means production telemetry, comparable traffic, or billing evidence was unavailable.

The Android and backend repositories did not provide production request logs, Cloud Run/hosting CPU or memory profiles, Firebase billing exports, or representative load-test results. Therefore, no production percentage savings or dollar savings are claimed.

## Initial resource-use findings

### Frontend

- **Measured (test harness):** The shared query cache combines concurrent reads, reuses fresh results, persists eligible snapshots, and invalidates dependent data after writes. Existing tests include three simultaneous consumers plus twenty repeat visits using one GET, and seller-status data restored after a simulated app restart with zero GETs.
- **Measured (test harness):** Place-label paths are public, use a one-day stale window and a seven-day maximum age, and now share a single cache key across callers.
- **Measured (code inspection):** Area autocomplete waits 350 ms and aborts obsolete requests. It is intentionally not cached because input changes and Google Places session tokens are part of the request.
- **Measured (code inspection):** OAuth userinfo, explicit basket price refresh, checkout, seller edits/uploads, reports, and explicit offline recovery are tied to authentication or user actions. They were not removed or deferred.
- **Measured (code inspection):** No recurring marketplace polling loop was found. Query refresh is driven by screen use, explicit refresh, cache freshness, or recovery events.
- **Not Yet Measured:** Real request counts per user session, cache hit rate, screen load times, image egress, app memory, and p95 request latency.

### Backend and data access

- **Measured (code inspection):** Public product pages use cursor pagination (24 results plus one look-ahead document) and document-ID ordering. The existing public product cache is in-process, coalesces identical concurrent reads, expires after 10 seconds, is bounded by entry/byte limits, and is invalidated on committed product/store writes.
- **Measured (code inspection):** Store status is intentionally read fresh rather than cached, so a seller suspension is not hidden by a stale visibility cache.
- **Measured (code inspection):** Product listing composite indexes for published/category, published/store, and published/category/store queries already exist in `firestore.indexes.json`; no index was added.
- **Measured (code inspection):** General repository list queries are capped at 100 documents. Order reads validate current permissions; checkout re-reads current products and store status in a transaction and checks price/stock before writing.
- **Measured (code inspection):** `FirebaseAdminService` lazily retains one Firestore instance per app process. The inspected marketplace module has no repeated connection initialization, WebSocket workload, or scheduled polling job.
- **Not Yet Measured:** Actual Firestore reads per request, cache hit ratio across server instances, Firestore/Google Places charges, database latency, backend CPU/RAM, throughput, and cost per order.

### Infrastructure and media

- **Measured (code inspection):** Product photo uploads are limited to 2 MiB and Cloudinary constrains stored images to 1400 by 1400 pixels. The app uses `expo-image` disk/memory caching for profile imagery.
- **Not Yet Measured:** Image bandwidth/egress, storage growth, hosting utilization, peak capacity, and current monthly infrastructure costs. Hosting was not resized and no paid cache service was introduced.

## Optimizations implemented

### Shared operating-area lookup cache

`OperatingAreaLabel` and `OperatingAreaField` use `useResource` for public `/areas/:placeId` reads. The existing query cache deduplicates concurrent calls and reuses fresh results; the field uses the resolved label without synchronously setting React state inside an effect. Lookup errors remain visible.

**Measured (test harness):** Three simultaneous loads followed by twenty visits to the same place-label key produce one fetch. This is a deterministic cache test, not a measured user session or server benchmark.

### Batched catalogue store lookups

`CatalogService` now requests the distinct store IDs used on a product page through the optional batch-reader interface. `FirestoreMarketplaceRepository.getMany` validates and deduplicates IDs, then uses Firestore `getAll`. Repositories without that method keep the existing individual-read fallback.

**Measured (test harness):** For three distinct stores, the catalogue uses one batch-reader call; the Firestore repository test verifies one `getAll` invocation and deduplicated references.

**Important billing limitation:** Three existing store documents still represent three Firestore document reads. This change reduces application/SDK lookup-call count and may reduce request overhead; it is not a three-to-one Firestore billed-read reduction, and no live latency improvement has been measured.

## Before-and-after benchmark results

| Metric | Before | After | Result and label |
|---|---:|---:|---|
| Identical place-label loads in the controlled test (3 concurrent + 20 repeats) | Direct component reads previously bypassed the shared cache; no production baseline recorded | 1 fetch for 23 cache loads | **Measured in unit harness**; 22 fewer harness fetches (95.7%) than 23 uncached calls. Not a production or billing percentage. |
| Catalogue visibility lookup calls for 3 unique stores | 3 individual repository reads in the previous code path | 1 batch-reader / `getAll` invocation | **Measured in unit harness**; SDK invocation count is down by 2 (66.7%). Firestore billed document reads remain 3. Live network calls and latency are **Not Yet Measured**. |
| Repeat identical public product-page reads within the server cache TTL | One Firestore query on cache miss | One query reused by the existing cache | **Measured in unit tests**, but this cache predates this audit; production hit rate is **Not Yet Measured**. |
| Seller-status reads after simulated restart with valid persisted data | No retained data in a fresh process | 0 GETs in the test | **Measured in unit test**; not a production session baseline. |
| API p50/p95 latency, requests per session, error rate, RPS | Not available | Not available | **Not Yet Measured**. |
| Firestore billed reads/writes, CPU/RAM, bandwidth, monthly cost, cost per order | Not available | Not available | **Not Yet Measured**. No monetary savings are claimed. |

### Cost calculations

No before/after billing data was available, so the cost-reduction formula cannot be applied. Batching store lookups does not reduce the number of Firestore documents read. Client cache reuse is expected to avoid some duplicate HTTP requests for identical, still-fresh data, but its production frequency and cost effect are **Not Yet Measured**.

## Files changed in this optimization pass

| File | Reason and benefit |
|---|---|
| Android `src/components/market/OperatingAreaLabel.tsx` | Reuses the shared cache for place labels instead of issuing an independent lookup per component. |
| Android `src/components/market/OperatingAreaField.tsx` | Reuses the shared cache to restore a missing label and derives the lookup error for rendering, avoiding a synchronous state update inside an effect. |
| Android `tests/query-freshness.test.mjs` | Verifies public-area cache policy and that concurrent/repeated place-label loads share one fetch. |
| Android `tests/account-profile.test.mjs` | Adds component mocks required after shared external-link and debounced-pressable imports were introduced in the broader UI work. |
| Android `tests/application-navigation.test.mjs` | Adds the shared debounced-pressable mock so existing wizard tests exercise the component without importing native UI. |
| Backend `src/modules/shopyethu/marketplace.types.ts` | Defines the optional batch-reader contract while preserving compatibility with existing repositories. |
| Backend `src/modules/shopyethu/marketplace.repository.ts` | Implements validated, deduplicated Firestore `getAll` reads. |
| Backend `src/modules/shopyethu/catalog.service.ts` | Batches unique store visibility reads for catalogue pages and browse results; retains a fallback for other repositories. |
| Backend `src/modules/shopyethu/catalog-cache.spec.ts` | Covers catalogue batching, Firestore reference deduplication, and the existing visibility/cache behavior. |

The shared query cache, Firestore public-product cache, product indexes, and existing image/upload limits were audited but not newly introduced by this optimization pass.

## Validation performed

- **Measured:** Android `npm run lint` passed with one existing warning: unused `accountUserDiagnostics` in `src/lib/auth.tsx`.
- **Measured:** Android `npm run typecheck` passed.
- **Measured:** Android `node --test tests/*.test.mjs` passed: 62 tests, 0 failures.
- **Measured:** Android `npm run export:android` completed successfully.
- **Measured:** Backend `npm run typecheck` passed.
- **Measured:** Backend `npm run build` passed.
- **Measured:** Backend `node --import tsx --test src/modules/shopyethu/catalog-cache.spec.ts` passed: 8 tests, 0 failures.
- **Measured:** Full backend `npm run test:shopyethu` ran 48 tests: 46 passed and 2 unrelated order-email tests failed. One expects template name `shopyethu-order-confirmation` while the implementation returns `order-confirmation`; the other expects missing `docs/shopyethu-order-confirmation.html`. These email files were not changed in this audit.

## Remaining risks and recommendations

1. Add privacy-safe production metrics for API route counts, response latency (p50/p95), errors, Firestore reads/writes, and cache hits/misses. Compare the same traffic and app flows before claiming savings.
2. Use Firebase billing exports and hosting metrics to compute actual cost per 1,000 active users, 10,000 requests, and completed order. Keep read counts separate from SDK batch-call counts.
3. Run a representative load test with realistic product/store counts and concurrent buyers before making capacity or hosting changes.
4. The public catalogue cache is process-local; its hit rate can vary across multiple backend instances. Measure this before considering a distributed cache. Redis was not introduced because its operational and monetary cost is not justified by current evidence.
5. Continue to validate stock, price, order state, and seller visibility on the server. Do not extend public cache TTLs or cache seller visibility without a consistency analysis.
6. Measure image egress and screen-level image sizes before changing Cloudinary delivery transformations or cache headers.

