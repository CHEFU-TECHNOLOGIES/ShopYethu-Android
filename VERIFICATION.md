# Verification record

Latest update: 14 November 2026.

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
