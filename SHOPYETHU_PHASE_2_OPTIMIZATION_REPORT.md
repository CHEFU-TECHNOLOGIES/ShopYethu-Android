# ShopYethu Phase 2 Resource Optimization Report

## Summary

Phase 2 targets billable Firestore writes, catalogue response bytes, and Android rendering work. It adds safe no-op write checks, an opt-in compact catalogue representation for the Android feeds, and a virtualized product gallery.

The changes are covered by tests and builds. They do not establish production savings: no Firestore billing export, real request-volume data, Cloudinary usage data, Fly utilization data, or production performance traces were available. No monetary savings or production percentages are claimed.

Phase 1 work is documented separately in [SHOP YETHU PERFORMANCE AND COST OPTIMIZATION REPORT.md](./SHOP%20YETHU%20PERFORMANCE%20AND%20COST%20OPTIMIZATION%20REPORT.md) and is not counted as a Phase 2 optimization.

## Evidence labels and scope

- **Measured**: observed in a repeatable local test or build.
- **Estimated**: inferred from the code path, not measured in production.
- **Not measured**: production telemetry or billing evidence was unavailable.

The review focused on Firestore operations, API payload size, Cloudinary delivery, Fly.io hosting, request logging, and Android rendering. No production load test or infrastructure change was performed.

## Existing resource configuration

| Area | Finding |
|---|---|
| Fly.io | **Measured (configuration):** [`fly.toml`](../chefu-inc-backend/fly.toml) sets Johannesburg (`jnb`), two minimum machines, auto-stop off, auto-start on, and one shared CPU with 1 GB per machine. Effective runtime utilization and current billing were unavailable, so sizing was not changed. |
| Firestore | **Measured (code):** visibility lookups can use `getAll`, but each existing store document still incurs a document read. Batching reduces SDK/repository call overhead, not billed document reads; that Phase 1 change is not counted again here. |
| Cloudinary | **Measured (code):** [`MarketImage.tsx`](./src/components/market/MarketImage.tsx) already requests `f_auto,q_auto,c_limit` variants; feed images default to 480 px, product detail uses 960 px, and cart rows use 160 px. Upload validation already limits images to 2 MiB and 1400 × 1400 px. No transformation or upload changes were made without usage data. |
| HTTP delivery | **Measured (code):** the backend enables response compression in [`main.ts`](../chefu-inc-backend/src/main.ts). The request logger supports `HTTP_SUCCESS_LOG_SAMPLE_RATE`; its code fallback is 1.0, while errors, slow requests, and separate security audit events remain logged. Fly's effective environment value and log cost were unavailable. |
| Android gallery | **Measured (code):** the product detail screen previously rendered its photo gallery with a `ScrollView`, mounting all photos together. It now uses a horizontal virtualized list. Actual image downloads, memory, and frame-time changes were not measured. |

## Phase 2 changes

### Avoid unchanged Firestore writes

- Product saves compare the submitted fields with the current product. An unchanged save no longer writes the product document. When a retry key is supplied, its idempotency reservation is still written so retry behavior is preserved; an unchanged legacy save without a key writes nothing.
- Store saves return the current document when name, description, area, and Place ID are unchanged.
- Repeating an identical seller suspension state and reason no longer writes the store document.

**Measured (test harness):** the test repository counts committed `set` operations. It verifies zero writes for an unchanged unkeyed product save, one reservation write for an unchanged keyed save, zero writes for an unchanged store save, and zero writes for a repeated identical suspension. The tests do not measure Firestore billing. Transaction reads and any Place ID validation remain; actual savings depend on how often clients submit unchanged values.

### Compact public catalogue responses

The public product and store listings accept the opt-in `view=compact` query. The existing response shape is preserved, but each product's description is empty and its photos array contains only the first photo. Search filtering still uses the full stored description before projection. Requests without this parameter retain the full response for older clients.

The Android Shop feed and seller storefront feed request compact responses. Product detail continues to request the full product.

**Measured (synthetic fixture only):** a 24-product test listing with approximately 4,000-character descriptions and five long photo URLs per product changed from **130,992 to 12,386 JSON bytes (90.5% smaller)**. With gzip, it changed from **1,200 to 550 bytes (54.2% smaller)**. Both uncompressed responses exceed the compression middleware's default 1 KiB threshold. The fixture is deliberately large and repetitive, not representative production data or a prediction of traffic savings.

**Not measured:** production response sizes, request counts, network egress, and associated charges. Compact responses do not reduce Firestore document reads.

### Virtualize product detail photos

The product-detail photo gallery now uses a horizontal `FlatList` with one initial item, batches of two, and a three-viewport render window. This limits mounted gallery images compared with eagerly mounting every photo. It does not establish a reduction in actual network requests or Cloudinary transformations; those require device and usage telemetry.

## Billable and operational effects

| Resource | Phase 2 effect | Evidence and limitation |
|---|---|---|
| Firestore writes | Avoids writes for tested unchanged product/store saves and repeated identical moderation updates. | Code behavior measured in unit tests; production frequency and dollar savings are not measured. |
| Firestore reads | No general read-count reduction claimed. No-op transaction paths still perform reads needed to verify current state. | No billing export or production read counts available. |
| API payload / egress | Compact feed responses omit descriptions and all but the first photo URL. | Synthetic fixture byte counts measured; production payload and egress savings not measured. |
| Cloudinary | No new image variants or upload behavior. Existing transformations and limits were audited. | Account usage and transformation charges unavailable. |
| Fly.io | No CPU, memory, or machine-count changes. | Configuration is known; utilization and billing are not. |
| Android rendering | Gallery work is virtualized. | No device-level memory, frame-time, or image-download benchmark performed. |

## Validation

- Android `npm run lint`: passed with one warning for the unused `accountUserDiagnostics` symbol in `src/lib/auth.tsx`.
- Android `npm run typecheck`: passed.
- Android `node --test tests/*.test.mjs`: **62 passed, 0 failed**.
- Android `npm run export:android`: passed.
- Backend `npm run typecheck`: passed.
- Backend `npm run build`: passed.
- Backend focused changed tests: **21 passed, 0 failed**.
- Backend `npm run test:shopyethu`: **49 passed, 2 failed**. The two failures are existing order-email expectations unrelated to these changes: one expects template name `shopyethu-order-confirmation` while the implementation returns `order-confirmation`; the other expects missing `docs/shopyethu-order-confirmation.html`. No order-email files were changed.

## Phase 2 files changed

| File | Reason and benefit |
|---|---|
| [`catalog.service.ts`](../chefu-inc-backend/src/modules/shopyethu/catalog.service.ts) | Skips unchanged product/store document writes and projects compact catalogue responses while preserving full-text filtering. |
| [`applications.service.ts`](../chefu-inc-backend/src/modules/shopyethu/applications.service.ts) | Skips repeated identical seller suspension writes. |
| [`marketplace.controller.ts`](../chefu-inc-backend/src/modules/shopyethu/marketplace.controller.ts) | Exposes the backward-compatible `view=compact` option on public product and store listings. |
| [`marketplace.testing.ts`](../chefu-inc-backend/src/modules/shopyethu/marketplace.testing.ts) | Counts committed test transaction writes so no-op behavior can be verified. |
| [`catalog-area.spec.ts`](../chefu-inc-backend/src/modules/shopyethu/catalog-area.spec.ts) | Verifies unchanged store saves do not write another document. |
| [`catalog-cache.spec.ts`](../chefu-inc-backend/src/modules/shopyethu/catalog-cache.spec.ts) | Verifies compact search/projection behavior, store listing projection, and synthetic JSON/gzip sizes. |
| [`marketplace.spec.ts`](../chefu-inc-backend/src/modules/shopyethu/marketplace.spec.ts) | Verifies repeated identical suspension updates do not write. |
| [`product-save.spec.ts`](../chefu-inc-backend/src/modules/shopyethu/product-save.spec.ts) | Verifies unchanged keyed and unkeyed product saves preserve idempotency without rewriting the product. |
| [`index.tsx`](./src/app/%28tabs%29/index.tsx) | Requests compact data for the main product feed. |
| [`[id].tsx`](./src/app/store/%5Bid%5D.tsx) | Requests compact data for the store product feed. |
| [`[id].tsx`](./src/app/product/%5Bid%5D.tsx) | Virtualizes product photos to reduce simultaneously mounted gallery content. |
| This report | Records Phase 2 changes, measured fixture results, configuration findings, limitations, and validation. |

## What remains unmeasured

To establish realized costs, compare equivalent production periods using Firestore billed reads/writes, API request counts and response bytes, Cloudinary storage/transformation/egress usage, Fly CPU/memory/network metrics, and Android screen-level rendering and image-load data. Until those measurements exist, keep cost claims limited to the tested code paths and synthetic fixture above.
