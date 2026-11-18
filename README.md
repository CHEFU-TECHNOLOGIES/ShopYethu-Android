# ShopYethu Android

ShopYethu by Chefu Technologies: one Expo SDK 58 / React Native app for local shopping and selling. Navigation uses Expo Router and the existing native tabs. The app uses the real ShopYethu icon and the shared CheFu OAuth server. There are no demo accounts, seeded products, fake approval switches, or simulated payment successes.

This project targets Android and iOS. The separate ShopYethu admin website handles marketplace administration; this project has no web launch script or web build target.

On first launch, a single welcome screen offers Start shopping or Sign in. Start shopping opens the public catalogue; Sign in opens the existing Account screen and CheFu sign-in flow. The choice is stored on the device with SecureStore, so later launches skip the welcome. There are no onboarding API requests. Shared product and storefront links continue opening directly. Storage failures allow the user to continue for the current app session.

## Run and verify

```sh
npm ci
npm run typecheck
npm run lint
npm run test:application
npm run test:seller
npm run test:cache
npm start
npm run export:android
```

Use the installed ShopYethu development build for testing. `expo-dev-client` provides the development launcher and developer menu, and `npm start` explicitly starts Metro with `--dev-client`. The Android and iOS launch scripts also target the installed development app. CheFu sign-in uses the registered native callback `shopyethu://sso-callback`.

For an installable Android development APK, use the GitHub workflow below. For local native compilation with an Android SDK and Java configured, run:

```sh
npm run build:android
```

Rebuild and reinstall the native APK after changing native dependencies, config plugins, URL schemes or splash settings. JavaScript-only edits use Metro and Fast Refresh. Android package: `za.co.chefu.shopyethu`. The API currently points to `https://api.chefu.co.za` in `src/lib/config.ts`.

Forms use `react-native-keyboard-controller` through the shared Page component to scroll the focused input above the keyboard, including lower and multiline fields. Installing this change requires a rebuilt development APK; restarting Metro alone cannot add the native keyboard module. Keyboard dragging dismisses the keyboard, and buttons remain tappable while it is open.

## Android GitHub Actions

The `Android Debug APK` workflow in `.github/workflows/android-debug.yml` runs directly on GitHub's Ubuntu runner. It installs dependencies including the development client, checks TypeScript and lint, generates the native Android project from Expo configuration, and builds with Gradle. It does not use EAS Build or require an Expo account, Expo token, or release signing secrets.

The workflow runs automatically on branch pushes. You can also start it from **Actions → Android Debug APK → Run workflow**. After a successful run, download `shopyethu-android-debug-<run>-<attempt>` from Artifacts, extract the ZIP and install the APK. Builds include ARM64 devices and x86_64 emulators. Artifacts are retained for 14 days.

The runner uses Node.js 24, Temurin Java 17, and the Android SDK/NDK versions needed by the current React Native dependencies. For the public runner's 16 GB memory budget, Gradle gets an 8 GB heap plus up to 1 GB metaspace, Node.js gets a 3 GB heap, and Gradle uses two workers. Kotlin compilation shares Gradle's process rather than starting another large compiler daemon. These are upper limits; unused memory remains available for native compilers and the OS.

This development APK loads JavaScript from Metro. Start `npm start` from the same source revision and scan the terminal's QR code in the installed ShopYethu development client. For a USB-connected device, run `adb reverse tcp:8081 tcp:8081` before opening the project in the app.

The `Android Release` workflow in `.github/workflows/android-release.yml` builds a signed APK and Play Store AAB with JavaScript bundled into the app. It runs on `v<app version>` tags and can also be started manually from **Actions → Android Release → Run workflow**. Tag builds create or update the matching GitHub Release; every run also uploads a 30-day Actions artifact. The Android version code uses the workflow run number.

Before using the release workflow, add these repository Actions secrets: `ANDROID_KEYSTORE_BASE64` (base64-encoded release keystore), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, and `ANDROID_KEY_PASSWORD`. Use the same long-lived upload keystore for every release and keep a secure backup; replacing it can prevent updates to the published app. The workflow never stores the decoded keystore as an artifact.

Both workflows use Node.js 24 and Temurin Java 17. Gradle receives an 8 GB heap, Kotlin compilation runs in-process, and the build uses two workers to fit the public runner's memory limit.

## Shared backend

Deploy the companion `chefu-inc-backend` changes and `CheFu-Account` mobile redirect-policy change before signing in. Mobile uses public OAuth client `shopyethu-mobile`, authorization code + S256 PKCE, scopes `openid profile email`, and the exact callback `shopyethu://sso-callback`. Credentials are stored with Expo SecureStore; a refresh request is shared across concurrent callers. Guest baskets and UID-specific signed-in baskets are stored separately; sign-in merges compatible baskets and preserves different-store baskets for an explicit switch. Account changes never display another account's basket. The admin website continues using its central browser cookie.

Backend records live in Firestore collections `shopyethu_applications`, `shopyethu_stores`, `shopyethu_products`, `shopyethu_orders`, `shopyethu_reviews`, `shopyethu_idempotency`, and `shopyethu_reports`. Mobile clients must not have direct Firestore write access to these collections. The backend's service account performs writes after authentication and authorization.

| Flow | API |
| --- | --- |
| Browse/search/category/store | `GET /shopyethu/products`, `/products/:id`, `/stores/:id`; product pages support newest and price sorting |
| Product reviews | Public `GET /shopyethu/products/:id/reviews`; authenticated `POST /shopyethu/products/:id/reviews` |
| Capabilities | `GET /shopyethu/config` |
| Own application and store permissions | `GET /shopyethu/me` |
| Apply/respond/resubmit | `POST /shopyethu/application` |
| South Africa–restricted area search | `POST /shopyethu/application/areas/suggestions`, `GET /shopyethu/areas/:placeId` |
| Store/inventory | `GET/PUT /shopyethu/seller/store`; opt into 24-product cursor pages with `GET /shopyethu/seller/store?page=1` and `?after=<cursor>` |
| Own product for editing | `GET /shopyethu/seller/products/:id` |
| Create/update/publish/unpublish | `POST /shopyethu/seller/products`, `PUT /seller/products/:id` |
| Move a published product to draft | `PUT /shopyethu/seller/products/:id/draft` |
| Delete a product | `DELETE /shopyethu/seller/products/:id` |
| Device photo upload | `POST /shopyethu/seller/photos` |
| Customer orders | `GET/POST /shopyethu/orders`; completed/collected orders can be reviewed using `GET /shopyethu/orders/:id/reviews` |
| Incoming seller orders/status | `GET /shopyethu/seller/orders`, `PUT /seller/orders/:id` |
| Listing/order reports | `POST /shopyethu/reports` |
| Staff review/suspension | `GET/PUT /shopyethu/admin/applications/:uid`, `GET/PUT /admin/sellers/:uid` |

Registered businesses cannot rename their storefront. Approval sets a server-owned
`nameEditable` rule; older stores resolve it from their original seller application.
The editor displays the current name as read-only and the backend rejects attempts
to change it. Individual sellers retain renaming, and other storefront details
remain editable. The existing store response carries this rule; no separate client
permission request or data migration is needed. Deploy the backend with the app.
The storefront editor displays the shared CheFu account phone and lets sellers
change it. Saving a contact number also records `whatsappAvailable` on the shared
user profile and synchronizes the number to the private seller application. A
changed number is saved as unverified, so the existing SSO gate can require SMS
verification before protected services use it. The valid shared phone and
WhatsApp availability are shown on the public store page; WhatsApp is displayed
only when the seller marks that number as available there.

After an order or review, a product's name, description, category, and photos are
locked; sellers can still update price and stock. The backend enforces this even
for older app versions. Before deploying the backend change, run
`npm run migrate:shopyethu-product-identity-locks` to review the backfill, then
run it with `-- --apply` to lock products referenced by existing orders or
reviews. Rerun the apply step after deploying the backend to cover any orders
created during the deployment window; the migration is idempotent.

Account, seller applications and Add product share an account-scoped, encrypted
cache for `GET /shopyethu/me`. Opening a screen reuses saved data without an
age-based backend check. This applies to every marketplace screen, including
application status, orders, catalogue, products, storefronts and inventory.
Owned-product editors can reuse the full inventory record. Saving/uploading
still checks current permissions on the backend. Concurrent consumers share one
request. Use Account refresh, application **Check status**, or pull to refresh to
fetch current data. Explicit refresh keeps saved content visible and shows progress.

Successful application submissions and storefront saves update the cache from
the server response without another GET. Sign-out and account changes clear it;
old requests cannot restore a previous account's data. Token refresh for the same
user keeps the cache. Restarting restores encrypted snapshots that fit the cache
budget, avoiding another status read. Connection failures preserve saved data and
offer Retry. Failed refreshes do not cause navigation/resume requests when usable
saved data exists. Missing-data retries have a 30-second cooldown; explicit
Refresh bypasses it.
Authentication/permission failures clear the cached data. The cache only controls
display; every seller mutation still checks current permissions on the backend.

There are no daily, hourly or per-minute query expiries. Cache misses, explicit
refresh, and known changes that invalidate related snapshots can request data.
Successful writes reuse their response; checkout and seller mutations validate
current server state inside their requests without an extra permission preflight.
Snapshots remain bounded by storage/memory budgets and clear on account changes.
Updates made elsewhere, new listings/orders and admin decisions require explicit
refresh until push invalidation is implemented. See `CACHING.md` for details.

The admin website's Applications, Sellers and Complaints views now read the real endpoints. Staff can approve, request more information, reject, suspend/reactivate, and inspect submitted reports. Customer-facing reasons appear in the mobile application. Admin permissions are checked from the current central user profile; seller actions check current store status and ownership on the server, including direct/stale requests. Approval is never granted by the phone.

## Seller application

Applications use four short steps: Business, Products, Contact & pickup, and Review. Each step validates before continuing; the final summary has Edit actions. Email comes from the signed-in account and cannot be changed in the form. The backend also derives it from the authenticated identity.

Business details include individual/sole trader or registered business, trading name and operating area. Applications are open to South Africans only. The operating-area picker uses Google Places, restricted to South Africa; only the selected Place ID is saved, and labels are resolved live with Google Maps attribution. Set `GOOGLE_MAPS_PLACES_API_KEY` on the backend; the backend repository's Google Places setup guide covers key restrictions. Applicants choose product categories and describe their products. The contact-number checkbox is the applicant's acknowledgement, **not SMS/OTP verification**. Changing the number clears that acknowledgement. Pickup area and hours are requested only if collection is offered; the form asks for an area, not a private street address. This application preference does not enable unconfigured fulfilment or automatically configure product listings.

Progress is saved after a short typing pause, when leaving the app, and through Save & exit. Drafts use encrypted device SecureStore, separate keys per account and chunked, serialized writes. Failed saves retain the last complete draft and show a retry message. Drafts belong to the current server application version; an old draft cannot overwrite a new review decision. There are no draft API writes or cross-device draft synchronization. Successful submissions clear the local draft. Abrupt termination before a save completes can lose the most recent edits.

The application screen shows server-recorded submission, information requests, resubmissions and decisions with dates and customer-facing messages. Staff can inspect the same details and history on the admin website. More-information requests return the applicant to the same editable steps, with a response on Review. History retains the latest 100 events; the original submission date is retained separately for new records. Older applications show their latest recorded update without inventing a submission date.

Deploy the companion backend validation/history changes and admin review display with this mobile update. Existing records remain reviewable. New submissions require the additional fields; older mobile builds need updating. No document-upload or SMS-verification service has been configured for applications; staff can request clarification through the existing customer-facing message and written-response flow.

## Seller workspace

My Store groups storefront details, real counts from the loaded inventory, Add product and Orders actions, and searchable Published/Draft filters. Product rows show a thumbnail, price, publication status and stock. Counts cover the loaded page (up to 100 records).

The product editor uses four short steps: Details, Photos, Price & stock, and Review. Sellers can select several device photos, remove photos and select a cover. Optional image-link entry is collapsed; raw URLs are not displayed in the photo grid. Validation matches the server's price/stock limits. Existing fulfilment choices are preserved during edits. Drafts can omit photos; publishing requires a photo. Leaving with unsaved changes prompts before discarding them.

Successful product and storefront saves update open My Store screens from the server response without polling or a return-to-screen read. Editing loads the specific owned product rather than fetching the full inventory. Backend checks still enforce current seller status and ownership on every request.

New clients send an Idempotency-Key for product creation and updates. The backend reserves the key transactionally and rejects reuse for different details. Replaying an accepted save returns the current product without restoring stock consumed by later orders. Edits also send their original version and stock; stale edits must reload before saving. A synchronous client lock prevents double taps. Already-saved, unchanged details are not submitted again.

Save attempts are encrypted on the device before submission, separately per account/product. An uncertain result freezes the details and offers Retry save with the same key/body, including after reopening the editor. The record is cleared after confirmation; it is not an autosave of unsubmitted product edits. Uploaded photo cleanup remains subject to the storage limitation below.

Deploy the backend changes **before** this mobile update: older endpoints ignore product retry keys and lack the single-product editing route. Existing clients without keys retain their previous behavior. Product creation, photo upload and publishing still require an end-to-end check with a real approved seller on Android.

Unused template graphics and orphaned Expo logo/badge components were removed. The only local project image is `assets/images/shopyethu-icon.png`, used by the app icon, splash, welcome, home and sign-in loading screen.

## Orders, photos and integration limits

The company-store Paystack integration is not a marketplace payment provider configuration. Online marketplace payments and delivery remain unavailable. Orders are disabled by default. Set `SHOPYETHU_PAY_ON_COLLECTION_ENABLED=true` **on the backend** only after the business enables real pay-on-collection fulfilment. Then collection orders are accepted; payment stays `not-collected`. No flow marks payment as successful. There is no fabricated delivery charge.

Device photos upload through the backend's existing Cloudinary storage module, using the configured `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET`. JPEG, PNG and WebP are limited to 2 MB, five per product. Failed uploads show errors. Public HTTPS photo links are also supported. Removed photo links are detached from a product; automatic deletion of orphaned Cloudinary uploads is not implemented.

Each order contains products from one store. Checkout revalidates price, stock, seller status and fulfilment in a Firestore transaction, and rejects products owned by the authenticated buyer. The app also hides add-to-basket controls for the owner and blocks checkout when an owner's product is already in their basket. Checkout decrements stock atomically and saves a server-side idempotency record. Double taps are locked in the client. Guest and UID-specific baskets, plus any unresolved order key/body, are encrypted on the device. Guests can add and manage products but must sign in to place an order. On sign-in, a compatible guest basket merges into the signed-in basket; baskets from different stores remain separately saved and can be switched without losing either. Uncertain order retries reuse the exact attempt, including after reopening the app. Server replay returns the original order without decrementing stock twice. Cancellation restores stock once. Signing out clears private query cache data but keeps the account's locally saved basket isolated for that UID.

Shop, storefront and seller inventory screens request 24 products per cursor page rather than fetching the full catalogue or inventory. Shop and storefront screens offer a sort selector for newest, lowest price and highest price; sorting and cursor pagination are performed by the backend. Shop product cards show a verified badge only when the backend confirms the seller has an approved registered-business application with its certificate on record. The Shop screen also keeps debounced search/category browsing. Settings lets the user choose whether the whole Shop screen scrolls or the header stays fixed while products scroll; the preference is saved locally on the device. My Store search/filtering applies to loaded pages; keep loading more pages to search further. Public product text matching still filters each scanned page; full-text indexing is not implemented. Order queries retain their existing 100-record cap. Order screens reuse saved lists; pull to refresh checks for new orders/status changes. Foregrounding only repairs missing/invalidated queries. There is no order polling. Reports are recorded for staff follow-up; automatic support messaging is not configured.

Buyers can leave a 1–5 star product review, with optional text, from a completed or collected order. The backend verifies order ownership and product inclusion, marks the review as a verified purchase, and allows one review per product per order. Product detail screens show the public rating summary and recent reviews. Seller/store reviews are not included.

Deploy the companion `chefu-inc-backend` catalogue sorting, verified review and seller-inventory cursor endpoints, and the required Firestore indexes, before releasing the Android update. The app explicitly reports an outdated backend response that omits the pagination cursor rather than presenting a silently truncated inventory.

Shared cache behaviour, per-feature freshness, encrypted persistence, offline recovery, toast coverage, backend/index deployment and measured request-count tests are documented in [CACHING.md](CACHING.md). No dependencies were added for this work.

## Verification and remaining live acceptance

Backend unit tests use isolated test-only dependencies, never an application route or a running data fixture. Run `npm run test:shopyethu` in `chefu-inc-backend` to check application decisions/resubmission, ownership, suspension, price/stock validation, simultaneous checkout, idempotent retries, cancellation and reports.

The full live acceptance flow requires deployed endpoints, configured real fulfilment, and real buyer, seller and staff sign-ins:

1. Applicant signs in, submits an application, and continues shopping.
2. Staff requests more information or approves in the admin website. Applicant refreshes Account; approval unlocks My Store.
3. Seller edits the storefront, uploads a real product photo, sets stock/price and publishes.
4. Buyer searches for the product, chooses collection, reviews the total and places one order.
5. Seller accepts, prepares and marks ready. Buyer refreshes Orders and sees the same reference and history.
6. Staff suspends the seller; direct/stale seller mutations and new orders must fail.

Do not call that live flow verified until it has actually run with these real accounts. Current check results and emulator limitations are recorded in `VERIFICATION.md`.
