# ShopYethu Android

ShopYethu by Chefu Technologies: one Expo SDK 58 / React Native app for local shopping and selling. Navigation uses Expo Router and the existing native tabs. The app uses the real ShopYethu icon and the shared CheFu OAuth server. There are no demo accounts, seeded products, fake approval switches, or simulated payment successes.

This project targets Android and iOS. The separate ShopYethu admin website handles marketplace administration; this project has no web launch script or web build target.

On first launch, a single welcome screen offers Start shopping or Sign in. Start shopping opens the public catalogue; Sign in opens the existing Account screen and CheFu sign-in flow. The choice is stored on the device with SecureStore, so later launches skip the welcome. There are no onboarding API requests. Shared product and storefront links continue opening directly. Storage failures allow the user to continue for the current app session.

## Run and verify

```sh
npm ci
npm run typecheck
npm run lint
npm start
npm run export:android
```

Use an SDK 58 compatible Expo Go for guest UI testing. CheFu sign-in uses the native callback `shopyethu://sso-callback`, so verify authentication in an installed Android build that owns the `shopyethu` scheme. Expo Go cannot register that application scheme.

For an installable APK, configure your Expo project and run:

```sh
npx eas-cli@latest build --platform android --profile preview
```

`eas.json` contains preview APK and production build profiles. No signed APK or cloud build is claimed by the source code checks. Android package: `za.co.chefu.shopyethu`. The API URL defaults to `https://api.chefu.co.za`; set `EXPO_PUBLIC_API_BASE_URL` at build time for another real HTTPS backend. No secrets belong in public environment variables.

## Android debug GitHub Actions

The `Android Debug APK` workflow in `.github/workflows/android-debug.yml` runs directly on GitHub's Ubuntu runner. It installs dependencies, checks TypeScript and lint, generates the native Android project from Expo configuration, and builds with Gradle. It does not use EAS Build or require an Expo account, Expo token, or release signing secrets.

Push the workflow to GitHub, then open **Actions → Android Debug APK → Run workflow**. After a successful run, download `shopyethu-android-debug-<run>-<attempt>` from Artifacts, extract the ZIP and install the APK. Builds include ARM64 devices and x86_64 emulators. Artifacts are retained for 14 days.

The runner uses Node.js 24, Temurin Java 17, and the Android SDK/NDK versions needed by the current React Native dependencies. For the public runner's 16 GB memory budget, Gradle gets an 8 GB heap plus up to 1 GB metaspace, Node.js gets a 3 GB heap, and Gradle uses two workers. Kotlin compilation shares Gradle's process rather than starting another large compiler daemon. These are upper limits; unused memory remains available for native compilers and the OS.

This is a debug APK that loads JavaScript from Metro. Start `npm start` from the same source revision. For a USB-connected device, run `adb reverse tcp:8081 tcp:8081` before opening the installed app. For an installable build with bundled JavaScript, use the preview build profile described above. The workflow has not been run on GitHub from this workspace.

## Shared backend

Deploy the companion `chefu-inc-backend` changes and `CheFu-Account` mobile redirect-policy change before signing in. Mobile uses public OAuth client `shopyethu-mobile`, authorization code + S256 PKCE, scopes `openid profile email`, and the exact callback `shopyethu://sso-callback`. Credentials are stored with Expo SecureStore; a refresh request is shared across concurrent callers. Account changes clear the basket and discard responses for the previous identity. The admin website continues using its central browser cookie.

Backend records live in Firestore collections `shopyethu_applications`, `shopyethu_stores`, `shopyethu_products`, `shopyethu_orders`, `shopyethu_idempotency`, and `shopyethu_reports`. Mobile clients must not have direct Firestore write access to these collections. The backend's service account performs writes after authentication and authorization.

| Flow | API |
| --- | --- |
| Browse/search/category/store | `GET /shopyethu/products`, `/products/:id`, `/stores/:id` |
| Capabilities | `GET /shopyethu/config` |
| Own application and store permissions | `GET /shopyethu/me` |
| Apply/respond/resubmit | `POST /shopyethu/application` |
| Store/inventory | `GET/PUT /shopyethu/seller/store` |
| Create/update/publish/unpublish | `POST /shopyethu/seller/products`, `PUT /seller/products/:id` |
| Device photo upload | `POST /shopyethu/seller/photos` |
| Customer orders | `GET/POST /shopyethu/orders` |
| Incoming seller orders/status | `GET /shopyethu/seller/orders`, `PUT /seller/orders/:id` |
| Listing/order reports | `POST /shopyethu/reports` |
| Staff review/suspension | `GET/PUT /shopyethu/admin/applications/:uid`, `GET/PUT /admin/sellers/:uid` |

The admin website's Applications, Sellers and Complaints views now read the real endpoints. Staff can approve, request more information, reject, suspend/reactivate, and inspect submitted reports. Customer-facing reasons appear in the mobile application. Admin permissions are checked from the current central user profile; seller actions check current store status and ownership on the server, including direct/stale requests. Approval is never granted by the phone.

## Orders, photos and integration limits

The company-store Paystack integration is not a marketplace payment provider configuration. Online marketplace payments and delivery remain unavailable. Orders are disabled by default. Set `SHOPYETHU_PAY_ON_COLLECTION_ENABLED=true` **on the backend** only after the business enables real pay-on-collection fulfilment. Then collection orders are accepted; payment stays `not-collected`. No flow marks payment as successful. There is no fabricated delivery charge.

Device photos upload through the backend's existing Cloudinary storage module, using the configured `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET`. JPEG, PNG and WebP are limited to 2 MB, five per product. Failed uploads show errors. Public HTTPS photo links are also supported. Removed photo links are detached from a product; automatic deletion of orphaned Cloudinary uploads is not implemented.

Each order contains products from one store. Checkout revalidates price, stock, seller status and fulfilment in a Firestore transaction. It decrements stock atomically and saves a server-side idempotency record. Double taps are locked in the client; retries with the same basket details reuse the attempt key. Server replay returns the original order without decrementing stock twice. Cancellation restores stock once. The basket is currently memory-only; closing the app clears it. Orders remain in Firestore and are visible after signing in again.

Lists are capped at 100 records per query in this first implementation. Catalogue text filtering occurs within that first page; cursor pagination/full-text indexing are not implemented. Order updates refresh explicitly; there is no background polling. Reports are recorded for staff follow-up; automatic support messaging is not configured.

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
