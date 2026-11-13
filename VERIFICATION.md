# Verification record

Date: 13 November 2026.

## Automated checks

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

The Android debug GitHub Actions workflow builds on GitHub's Ubuntu runner using Expo prebuild and Gradle, with no EAS service or Expo token. Local native project generation completed, and workflow YAML/Bash syntax, TypeScript and lint checks passed. The GitHub workflow and its Gradle APK build have not been executed from this workspace. Its manual trigger and artifact download instructions are documented in README.md.

An Android API 36 emulator was detected and Expo Go 58.0.5 installed. Launch attempts were interrupted by Android system application-not-responding dialogs, including “Process system isn't responding”. The latest screenshot therefore does not verify the ShopYethu screen. Guest navigation and the visual layout are not claimed as emulator verified.

The full signed-in buyer/seller flow has **not** been demonstrated on an Android device. It requires an installed build that registers `shopyethu://sso-callback`, real buyer/seller/staff sign-ins, a real published product and configured fulfilment. Expo Go cannot own the app's custom OAuth scheme. No signed APK or EAS build has been produced.

Remaining acceptance: application submission while shopping, staff approval unlocking My Store, publication of a real product, buyer checkout, seller fulfilment updates visible to the buyer, and rejection of stale seller requests after suspension. The exact sequence is in README.md. Online payment and delivery remain unavailable until integrated; no successful payment is simulated.

The welcome screen also needs a native device check: a fresh install shows Start shopping and Sign in, either action enters the correct screen, and restarting after a choice skips the welcome. The preference is local to the device and requires no backend request. Web preview checks were stopped at the user's request; the project targets Android and iOS only.
