# ROT. — The Brainrot Club (Android Executive Demo)

ROT. is a local-first, privacy-respecting digital wellbeing companion that helps Gen Z users build healthier scrolling habits through playful missions, gentle boundaries, and honest Android `UsageStats` foreground estimates—without shame, dark patterns, or requiring an Instagram login.

---

## Executive Demo Scope

1. **Android Development-Build Foundation:** Native Android project (`android/`) configured for Expo SDK 58 + React Native 0.88 (`com.rot.brainrotclub`).
2. **Instagram Foreground Tracking (`UsageStatsModule.kt`):** Queries `UsageStatsManager` (`queryEvents` with multi-activity transition tracking across `InstagramMainActivity`, `ModalActivity`, and `TransparentModalActivity`, plus `queryUsageStats(INTERVAL_DAILY)` fallback) for `com.instagram.android`.
3. **Consent & Usage Access Setup:** In-app consent modal explaining what is read and what is never collected, with direct deep-linking to Android `Settings.ACTION_USAGE_ACCESS_SETTINGS` and automatic refresh on `AppState` foreground resume.
4. **Honest Data-Quality Dashboard:**
   - Clearly labels active metrics as **`estimated Instagram foreground time`** (never claiming exact Reel counts).
   - Explicitly distinguishes **`Setup needed`**, **`Access needed`**, **`Tracking paused`**, **`No IG app`**, and **`Unavailable`**—never displaying missing data as `0h 00m`.
5. **Configurable Daily Scroll Target & Remaining Time:** Supports `30m`, `1h 00m`, `1h 30m`, `2h 00m`, and `3h 00m` targets (plus optional `+30m` Weekend Breathing Room) with non-shaming gentle nudges at 80% and 100%.
6. **Persistent Missions, Idempotent XP, Daily Chest & Badges:** Persisted locally via `AsyncStorage` (`@rot_executive_demo_state_v1`) with deterministic event keys (`mission:<date>:<id>`, `chest:<date>`, `break:<date>:<session>`) preventing duplicate XP awards.
7. **Focus Break Timer:** Supports 1-minute (demo), 5-minute, and 10-minute focus sessions, awarding `+30 XP`, completing the *"Touch some grass"* mission, and unlocking the **`Offline Icon`** badge.
8. **Privacy & Local History Reset:** One-tap local history deletion in **Settings > Local Data & History**.

---

## Prerequisites

- **Node.js:** v22+ or v24+
- **JDK:** 17 or 21 (`JAVA_HOME` configured)
- **Android SDK:** API 36 / Build Tools 37.0.0 / NDK 27.1.12297006
- **Android Device or Emulator:** Android 8.0+ (tested on physical device running Android 14 / API 34 with Instagram installed)

---

## Quick Start & Build Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Automated Checks (TypeScript, Lint, Unit Tests)

```bash
npm run typecheck
npm run lint
npm test
```

### 3. Build & Install the Android Development App

With an Android device connected via USB or Wireless Debugging (`adb devices`):

```bash
# Option A: Build & install debug APK via Gradle
cd android
./gradlew installDebug

# Option B: Run via Expo CLI
npx expo run:android
```

Then start the Metro bundler from the project root:

```bash
npx expo start --dev-client
```

> **Standalone Debug Bundle (No Metro Required):**
> You can also bundle the JS payload into `android/app/src/main/assets/index.android.bundle` before running `./gradlew assembleDebug` to run the debug APK without an active Metro server.

---

## Granting Android Usage Access

1. On first launch, ROT presents the **Transparent Usage Setup** modal.
2. Tap **Agree & Open Android Usage Access**.
3. In Android's **Usage access** settings screen, select **ROT.** and toggle **Permit usage access** ON.
4. Return to **ROT.** — the dashboard automatically re-queries `UsageStatsManager` and displays today's estimated Instagram foreground time.

For automated testing via ADB:

```bash
# Grant Usage Access via AppOps
adb shell appops set com.rot.brainrotclub GET_USAGE_STATS allow

# Revoke Usage Access to test the "Access needed" state
adb shell appops set com.rot.brainrotclub GET_USAGE_STATS ignore
```

---

## Known `UsageStats` Technical Limitations

1. **App-Level Granularity Only:** Android `UsageStatsManager` reports package-level activity lifecycle events (`com.instagram.android`), not in-app views. ROT reports **estimated Instagram foreground time** and never claims exact Reel counts.
2. **OEM Daily Bucket Quirks:** Certain OEM skins (e.g., Xiaomi MIUI/HyperOS) emit duplicate daily summary buckets in `queryUsageStats(INTERVAL_DAILY, ...)`. `UsageStatsModule.kt` prioritizes granular `UsageEvents` (`ACTIVITY_RESUMED` / `ACTIVITY_PAUSED`) for recent days and deduplicates fallback buckets by taking the maximum bucket duration per day window.
3. **OS Event Retention:** Android retains granular `UsageEvents` for approximately 7 days and prunes older events at the OS level.
