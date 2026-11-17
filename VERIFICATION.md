# Verification record

## Guest baskets, catalogue sorting and verified product reviews

- Guest baskets persist separately from UID-specific account baskets. Sign-in merges compatible same-store baskets, while different-store baskets remain saved and switchable. Checkout remains sign-in-only.
- Catalogue sorting supports newest, lowest price and highest price through backend cursor queries. Completed/collected order items can receive one verified product review per order/product; product pages show public rating summaries and reviews.
- Android typecheck, targeted ESLint and 22 focused cart/cache tests passed. Backend typecheck and 17 targeted marketplace/catalog tests passed; targeted ESLint passed for changed runtime files and `catalog-cache.spec.ts`. The Firestore index JSON parsed successfully.
- Linting the full `marketplace.spec.ts` still reports six `no-floating-promises` findings, including a newly added test call. The tests pass; the full spec's lint findings remain unresolved.
- Firestore indexes have not been deployed, and no native device smoke test or live backend acceptance flow was performed.

## Cache-first navigation and unchanged storefront saves — 17 November 2026

- Every query reuses saved data without time-based expiry: catalogue, products, storefronts, inventory, account, application status, config and buyer/seller orders, including empty lists. Screen focus/resume does not recheck saved snapshots by age. Owned-product details reuse full inventory; manual/conflict reload still fetches the server.
- Product-card scrolling/touch cancellation makes zero detail requests; a completed tap and the screen share one request. Confirmed edits/drafts/deletions update loaded lists without unnecessary invalidation. New matching publications and unknown current stock still invalidate affected snapshots.
- Storefront Save is disabled when unchanged and the handler refuses unchanged submissions. Whitespace, a resolved label for the same place ID, autocomplete tokens and a stale locked name do not enable Save. Changing and reverting editable fields disables it again. Product and storefront pages offer explicit pull-to-refresh.
- All 44 cache tests, 10 seller tests and 14 application tests passed. Request-counter tests cover 90–100 days of repeat screen visits with no additional GETs, a restart with 90-day-old status, Check status applying backend approval, zero offline-resume probes, inventory reuse, relevant invalidation, forced refresh and zero-request unchanged saves. Typecheck passed; lint has zero errors and the existing unused `accountUserDiagnostics` warning.
- Authentication expiry/refresh, seller authorization, ownership, stock/price validation, order idempotency and payment checks remain server enforced in action requests. Application Check status and pull-to-refresh explicitly fetch decisions/new orders/status updates. There are no polling or freshness timers and no automatic offline connectivity probes. Missing, evicted or known-invalidated data can still require a read. Remote changes require explicit refresh until push invalidation is added. These are automated request counts, not measured production savings. No emulator/device or live-account verification was performed for this audit.

## Registered-business store names — 17 November 2026

- Registered business names are read-only in the store editor and cannot be renamed through a direct API request. Individual sellers can still rename their stores. Unsaved names from stale drafts are ignored when the rule is locked; descriptions and operating areas remain editable.
- Approval stores the rule on the storefront. Existing stores resolve it from their original application; unchanged reads/saves add no writes. The existing account/store responses carry the rule, so no separate client permission call is needed.
- Eleven targeted backend policy, store-area and approval tests passed. Eight mobile seller form/action/name tests passed, including stale-draft payload protection and individual renaming. Typechecks passed; mobile lint has one existing warning and no errors. The rule requires deploying the backend with the mobile update; native visual verification was not performed.

## My Store draft and delete actions — 17 November 2026

- Each inventory row has a product-actions menu with Edit, Move to draft (published products) and Delete. Delete requires confirmation; in-flight requests block repeat taps and dismissal. Server errors stay in the sheet for retry. The new component is separate from the store screen.
- Seven new backend tests passed: fresh authorization/ownership, stock-preserving draft updates, idempotent retries, deletion with existing orders, stale-save rejection, fulfilment after deletion, route guards and public-cache invalidation. Backend typecheck, build and lint for changed runtime/new test files passed. Full marketplace suite: 56 passed, 2 existing failures in order-email tests (template alias mismatch and missing HTML fixture).
- Android: 6 seller form/action tests and 36 cache/integration tests passed. Draft/delete responses update loaded inventory without an extra GET. Typecheck passed; lint has no errors and one existing unused-import warning in `auth.tsx`.
- Backend deployment and an updated app build are needed. Native visual interaction has not been verified on an emulator/device for these actions. Existing orders remain valid; deleting does not cancel them or change their payment status.

Latest update: 15 November 2026.

## Longer caching and saved-account correction

- Seller status now reuses the encrypted account snapshot on ordinary account visits, up to seven-day retention and within existing storage/memory budgets. Application and product editor entry uses a one-minute freshness requirement; closing those screens removes that requirement. No polling timer was added. Catalogue, product, storefront, inventory, configuration and order policies are documented in `CACHING.md`.
- All 34 cache/bridge/resource tests passed. Controlled counters cover twenty account revisits and foreground events across sixty simulated hours using one GET; a day-old encrypted snapshot restores after restart with zero GETs. Unchanged flushes add no writes, and seller status gets priority when inventory would exceed the disk budget. Action-context freshness, manual loading, account isolation and stock-related invalidation are covered. These are automated measurements, not device benchmarks.
- The companion backend's duplicate chooser entries were caused by saved session slots surviving a fresh sign-in to the same UID, then being returned alongside the active account. Listing now deduplicates verified UIDs, while sign-in/switch/removal reconciles saved cookies. Sixteen account-session tests and all 52 selected account/authentication/phone-enforcement tests passed; backend typecheck, build and lint for the changed files passed. The account web app's 56 SSO tests also passed.
- Backend deployment is required for saved-account reconciliation. Android changes require an updated app build. No live account cookies were inspected, and these changes were not verified in a browser or on an emulator/device during this task.

## Order confirmation email

- Confirmed order creation now sends the authenticated buyer a hosted Resend template, `shopyethu-order-confirmation`, with the existing `SY-…` order reference as the collection code. Buyer and seller order cards explain how to use it at collection. No additional database reads/writes or native dependencies were added.
- All 37 backend marketplace tests passed, including six order-email tests for committed-only sends, duplicate/retried checkout, provider retries, recipient integrity, escaped/bounded variables and mail failure preserving the order. Tests mock Resend; no live email was sent. Android typecheck and lint passed for the order-card copy change.
- Publish the template using the HTML and variable list in `chefu-inc-backend/docs/shopyethu-order-confirmation.html` and its companion Markdown guide. Delivery and collection matching still need a live acceptance check after the backend is deployed and the template is published. Email delivery is best effort; the order/code remains accessible in the app if mail fails.

## Shared cache update

- Android: 48 unit tests passed, including 23 cache/bridge/seller-status tests. Typecheck and lint passed. Android Hermes export passed (1,869 modules; 4.7 MB bundle).
- Backend: typecheck, build and all 31 marketplace tests passed. Six new cache/repository tests cover deduplication, TTL expiry, in-flight invalidation, private-query bypass, store suspension, cursors/index definitions and idempotent order recovery. The email-template assertion now matches the existing configured `seller-account-approval` alias.
- Request counters: three simultaneous consumers plus twenty repeat reads require one GET before expiry; expiry adds one GET. Restoring fresh public/account snapshots requires zero GETs. Confirmed application/store/product/order mutation responses update related records with zero follow-up reads. These are controlled test measurements, not real-device latency or frame-rate benchmarks.
- No emulator/device is connected: `adb devices` returned an empty list. Live sign-in, restart/offline recovery, scrolling, photo-cache behaviour and buyer/seller flows still need Android acceptance testing. No real emails, orders or fixture data were created by these tests.
- Deploy the companion backend and three product composite indexes before releasing the mobile update. Indexes are local changes only. Full backend lint reports existing test-file promise errors outside this change; changed runtime/cache files are checked separately. See [CACHING.md](CACHING.md) for architecture, limits and follow-up work.

## Seller workspace and asset cleanup — 14 November

- My Store now groups storefront details, inventory counts, product search/filters, and product/order actions. Product editing uses Details, Photos, Price & stock, and Review steps, with photo selection, cover controls and an unsaved-changes prompt.
- Product saves use backend idempotency keys, current seller/ownership checks and optimistic version/stock checks. Interrupted save attempts are encrypted locally and retried with the same key and body. Successful responses update the open inventory without focus polling. Editing reads a specific owned product instead of the entire inventory.
- Removed 24 unused assets (1,428,657 bytes) and four unreferenced starter components/styles. The active ShopYethu icon remains. Android bundling confirms the referenced local assets resolve.
- Automated checks: Android typecheck, lint and Hermes export; three seller-form tests; six encrypted draft-storage tests; backend typecheck/build and sixteen marketplace tests. These checks do not demonstrate the seller interface on a device.
- The previously downloaded GitHub development build #3 was installed on the running emulator, but predates the native keyboard-controller dependency and these seller changes. A new development APK and real approved seller account are still needed to verify photos, keyboard scrolling, publication, interrupted saves and stock conflicts on Android. No demo data was added.
- Backend phone verification now has a separate authenticated, rate-limited module and sixteen passing isolated tests. The seller application phone checkbox remains an acknowledgement: the mobile OTP interaction and requirement to match a saved backend verification are not connected. See the backend phone-verification README for deployment requirements.

## Automated checks

- Seller application update: the form now has four steps with per-step validation, conditional collection questions, read-only account email, editable review summaries, encrypted local drafts, explicit draft recovery and a dated backend status timeline. Six device-storage unit tests passed, covering long Unicode input, interrupted writes, recovery, ordered saves/clear, account isolation and corrupted data. All eleven backend marketplace tests passed, including the new server validation/history, legacy record and private-contact-data checks. Backend and admin typecheck/build passed. Final Android typecheck, lint and Hermes export passed (1,806 modules; 4.6 MB bundle). GitHub workflow YAML parsed successfully and includes the draft tests. This does not verify the wizard visually on an Android device. Application document upload and SMS verification remain unconfigured; phone confirmation records only the applicant's acknowledgement.

- Keyboard visibility: the shared Page uses KeyboardAwareScrollView with a 24-point clearance and a root KeyboardProvider. Typecheck, lint, Android bundle export and native Android autolinking checks passed. Expo Doctor's online config-schema check failed because its TLS connection to the Expo API was interrupted; the other checks did not report failures. A rebuilt development APK is required for the added native keyboard module. Keyboard behaviour has not yet been verified on a device: check operating area, long multiline text, response/resubmission, checkout, and switching between fields while the keyboard stays open.

- Development-build readiness: installed the SDK-compatible `expo-dev-client`, configured Metro scripts to use `--dev-client`, and retained the GitHub/Gradle build path. All 20 Expo Doctor checks, dependency version validation, TypeScript, lint, and workflow syntax checks passed. Native configuration introspection confirmed both `shopyethu` (SSO) and `exp+shopyethu` (development launcher) schemes for `za.co.chefu.shopyethu`. A rebuilt development APK, Metro connection and real sign-in still require device verification.

- Reproduced the CI CSS type errors with generated `expo-env.d.ts` and `.expo/types` excluded. Adding the tracked `src/types/expo.d.ts` reference to Expo's ambient declarations fixed that clean-environment check; normal typecheck and lint also passed. This does not run or enable a web build.

- Android TypeScript and full-app lint passed after fixing the Account sign-in button expression and adding its external-link icon.
- Android Hermes export passed after adding the first-launch welcome screen (`npm run export:android`). This is a JavaScript bundle export, not a signed installable APK.
- Backend typecheck and build passed. Seven marketplace tests passed, covering application review/resubmission, authorization, suspension, order transitions, atomic stock validation, concurrent checkout and idempotent retries. Test dependencies are isolated from runtime; no demonstration accounts or data are served.
- Admin website typecheck/build passed. Central account typecheck and 20 redirect/SSO tests passed.

## Live API checks

Read-only requests to the shared API returned:

- `GET /shopyethu/config`: HTTP 200; collection disabled and marketplace payments not configured.
- `GET /shopyethu/products`: HTTP 200; an empty product list.
- Unauthenticated `GET /shopyethu/seller/store`: HTTP 401.

No accounts, listings, applications or orders were created for these checks. No demo data or runtime demo features were added.

## Android device verification

The Android debug GitHub Actions workflow builds on GitHub's Ubuntu runner using Expo prebuild and Gradle, with no EAS service or Expo token. Local native project generation completed, and workflow YAML/Bash syntax, TypeScript and lint checks passed. The GitHub workflow and its Gradle APK build have not been executed from this workspace. Its automatic push trigger, optional manual trigger and artifact download instructions are documented in README.md.

An Android API 36 emulator was detected and Expo Go 58.0.5 installed. Launch attempts were interrupted by Android system application-not-responding dialogs, including “Process system isn't responding”. The latest screenshot therefore does not verify the ShopYethu screen. Guest navigation and the visual layout are not claimed as emulator verified.

The full signed-in buyer/seller flow has **not** been demonstrated on an Android device. It requires an installed build that registers `shopyethu://sso-callback`, real buyer/seller/staff sign-ins, a real published product and configured fulfilment. Expo Go cannot own the app's custom OAuth scheme. No signed APK or EAS build has been produced.

Remaining acceptance: application submission while shopping, staff approval unlocking My Store, publication of a real product, buyer checkout, seller fulfilment updates visible to the buyer, and rejection of stale seller requests after suspension. The exact sequence is in README.md. Online payment and delivery remain unavailable until integrated; no successful payment is simulated.

The welcome screen also needs a native device check: a fresh install shows Start shopping and Sign in, either action enters the correct screen, and restarting after a choice skips the welcome. The preference is local to the device and requires no backend request. Web preview checks were stopped at the user's request; the project targets Android and iOS only.
