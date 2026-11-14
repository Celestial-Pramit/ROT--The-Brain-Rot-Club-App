# ROT. — The Brainrot Club (Android MVP)

ROT. is a local-first, privacy-respecting Android digital wellbeing companion that helps users build healthier Instagram scrolling habits through honest `UsageStats` foreground-time estimates, daily targets, streaks, focus breaks, notifications, and shareable collector cards—without shame, dark patterns, or Instagram login.

Full Phase 1 historical milestones, Phase 2 MVP architecture, physical-device QA results, and the complete SRS cross-check matrix (`FR-001`–`FR-031`, `NFR-01`–`NFR-18`, `BT-01`–`BT-15`, `AT-01`–`AT-12`) are documented in [docs/EXECUTIVE_DEMO_REPORT.md](docs/EXECUTIVE_DEMO_REPORT.md).

---

## Current MVP Scope (`feature/rot-mvp-core` — `PR #2` & `PR #2.1`)

1. **Android Development Build & Native Bridge (`android/`):** Native Android project (`com.rot.brainrotclub`) configured for **Expo `~58.0.24`**, **React Native `0.88.1`**, **React `19.3.0`**, **TypeScript `~6.0.3`**, and **WorkManager `2.10.0`** with New Architecture and Hermes enabled.
2. **Local-First Profile & Device Identity:** Automatically resolves the Android device name (`Settings.Global.DEVICE_NAME`, `bluetooth_name`, or `Build.MODEL`) on first launch, allows custom display-name editing from Today or Settings (max 28 characters), persists locally in `AsyncStorage`, and reverts cleanly to the device default or `"ROT User"` fallback.
3. **Instagram Foreground Tracking (`RotUsageTracker.kt` & `UsageStatsModule.kt`):** Queries `UsageStatsManager` (`queryEvents` across foreground activity lifecycle transitions with deduplicated `INTERVAL_DAILY` fallback) for `com.instagram.android` across a rolling 7-day window.
4. **Honest 9-State `UsageStats` Data Contract:**
   - Distinguishes `permission_required`, `tracking_paused`, `not_installed`, `no_os_record`, `query_failed`, `stale`, `incomplete`, `zero_usage`, and `ok`.
   - **Never displays missing, paused, or failed data as `0h 00m`**, preserves `cachedUsageSummary`, and labels metrics strictly as **estimated Instagram foreground time** (never claiming exact Reel counts).
5. **Custom Targets, Brainrot Index Breakdown & Mood Check-In:**
   - Preset daily targets (`30m`–`3h 00m`), `±5m` steppers, custom target input (`15m`–`720m`), and optional **Weekend Breathing Room** (`+30m`).
   - Expandable Brainrot Index score breakdown (`0–99`) and daily **Mood Check-in** drawer with 4 presets, 120-char notes, and recent mood history.
6. **Streak & Grace-Day Engine, Usage-Linked Missions & Weekly Quests:**
   - Daily streak evaluator with 1 weekly automatic **Grace Day**, non-punitive missing-data handling, and streak recovery (`+25 XP`).
   - 4 daily missions (including auto-verified `stay-under-target`) and 3 auto-tracked Weekly Quests (`Balanced Week`, `Focus Break Master`, `Target Guardian`).
7. **Idempotent XP, Brain Bank Ledger, Levels, Focus Breaks, Badges & Local Leaderboard:**
   - Deterministic event keys (`claimedXpEvents`) backed by a verified **Brain Bank XP Ledger** (`Verified · <N> XP`), interactive top-bar XP pill shortcut, player levels, `1m` / `5m` / `10m` Focus Break timer (`expo-audio` WAV jingles), Daily Reward Chest, and 6 unlockable badges.
   - Local-only **Leaderboard** preview (`Friends`, `Squad`, `Campus` tabs in `data.ts`) merging your live identity and XP with static demo club entries (no backend multiplayer).
8. **Native Notifications, Persistent Unread Badge & Background Scheduling:**
   - Real Android notification channels (`rot_wellbeing_nudges`, `rot_scheduled_reminders`), `WorkManager` 15-minute periodic budget checks (`RotUsageCheckWorker.kt`), `AlarmManager` daily reminders (`RotNotificationScheduler.kt`), configurable quiet hours, and `RotBootReceiver` for boot/time-change rescheduling.
   - Native `SharedPreferences` inbox (`RotNotificationPrefs.kt`) powers the in-app **Notification Center** (`NotificationCenterModal.tsx`) and persistent top-bar bell badge (`0` hidden, `99+` cap).
9. **Dual Shareable Cards, Private Mode & Android Gallery / Share Sheet (`RotCardMediaModule.kt`):**
   - Swipeable **Archetype Collector Card** and **Weekly Achievement Card** with a modal export hub (`CardSelectionModal.tsx`) that freezes background gestures while open.
   - Generates `1080x1350` (Feed `4:5`) and `1080x1920` (Story `9:16`) PNGs via `react-native-view-shot`, supports Private Mode stats redaction, saves to `Pictures/ROT` via `MediaStore` with duplicate prevention, and launches the native Android Share Sheet via `FileProvider`.
10. **Privacy Controls & Data Portability:** One-tap tracking pause, structured JSON export (`rot-user-data-export-v1`) with inline preview, and two-tap `Clear local history` in Settings.

---

## 1. Prerequisites

| Requirement | Verified Version / Configuration |
| :--- | :--- |
| **Node.js** | v22+ or v24+ |
| **JDK** | JDK 17 (`JAVA_HOME` configured) |
| **Android Build** | `newArchEnabled=true`, `hermesEnabled=true`, `reactNativeArchitectures=arm64-v8a`, `androidx.work:work-runtime-ktx:2.10.0` |
| **Expo / React Native** | `expo@~58.0.24`, `react-native@0.88.1`, `react@19.3.0`, `typescript@~6.0.3` |
| **Target Device** | Physical Android device or emulator (verified on **Xiaomi Redmi 11 Prime**, Android 14 / API 34) |

---

## 2. Local Setup

Clone the repository, check out `feature/rot-mvp-core`, and install dependencies:

```bash
git checkout feature/rot-mvp-core
npm install
```

---

## 3. Android Debug Build

To compile the native Android debug APK (`android/app/build/outputs/apk/debug/app-debug.apk`):

```bash
# macOS / Linux
cd android && ./gradlew :app:assembleDebug --no-daemon

# Windows (PowerShell / CMD)
cd android && .\gradlew.bat :app:assembleDebug --no-daemon
```

> **Windows Long-Path Mitigation:** `android/app/build.gradle` configures a root-relative CMake staging directory (`${rootDir.toPath().root}rot-cxx`) and `-DCMAKE_OBJECT_PATH_MAX=210` so Windows builds succeed regardless of repository folder depth.

---

## 4. Physical Device Installation

1. Enable **Developer Options** and **USB Debugging** (or Wireless Debugging; plus **Install via USB** on Xiaomi/MIUI devices) on your Android phone.
2. Verify device connection:
   ```bash
   adb devices -l
   ```
3. Install the debug APK, forward the Metro bundler port, and launch the application:
   ```bash
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   adb reverse tcp:8081 tcp:8081
   npx expo start --dev-client
   ```

---

## 5. Android Permissions Setup

- **Usage Access (`PACKAGE_USAGE_STATS`):** Required for Instagram foreground-time estimates. ROT opens Android's **Usage access** screen from the onboarding modal, Today banner, or Settings and rechecks on app resume.
- **Notifications (`POST_NOTIFICATIONS` on Android 13+):** Required for budget nudges and evening/streak reminders. Manageable per channel in **Settings > Preferences & Local Notifications**.
- **Boot & Alarm Rescheduling (`RECEIVE_BOOT_COMPLETED`):** Allows `RotBootReceiver` to re-register periodic `WorkManager` jobs and `AlarmManager` reminders after device restart or timezone changes.

For automated ADB testing:

```bash
# Grant / revoke Usage Access via AppOps
adb shell appops set com.rot.brainrotclub GET_USAGE_STATS allow
adb shell appops set com.rot.brainrotclub GET_USAGE_STATS ignore
```

---

## 6. Xiaomi / MIUI Notes

- On **Xiaomi MIUI / HyperOS (Android 14)**, opening `Settings.ACTION_USAGE_ACCESS_SETTINGS` triggers MIUI's `SpecialPermissionInterceptActivity` 10-second security dialog before **Accept** becomes enabled.
- `RotUsageTracker.kt` prioritizes granular `queryEvents` transitions and deduplicates MIUI's `INTERVAL_DAILY` buckets by taking the maximum bucket duration per day (`status: 'incomplete'` when only bucket data exists).
- MIUI battery/autostart restrictions may delay background `WorkManager` or `AlarmManager` triggers unless ROT is exempted in system battery settings.

---

## 7. Verification Commands

Run all static and unit checks from the project root:

```bash
npm run typecheck
npm run lint
npm test
```

Latest verified suite: `tsc --noEmit` (`0` errors), `npm run lint` (`27` files), `npm test` (`15` passed, `0` failed), and `:app:assembleDebug` (`BUILD SUCCESSFUL`).

---

## 8. Known Limitations & Unverified Scenarios

1. **App-Level Foreground Granularity Only:** `UsageStatsManager` cannot verify individual Reels watched; ROT reports **estimated Instagram foreground time** only.
2. **OS `UsageEvents` Retention (~7 Days):** Android retains raw `UsageEvents` for approximately 7 days before pruning older events.
3. **Local-Only Social Preview:** The Leaderboard tab uses local demo club members merged with the user's live XP; real backend accounts, squads, and friend challenges remain post-MVP.
4. **Pending Live Runtime Checks (`NOT VERIFIED`):** Unattended wall-clock `AlarmManager` firing, physical device reboot recovery (`RotBootReceiver`), `100+` live notifications (`99+` badge overflow tested in unit tests only), and standalone release APK generation have not yet been verified on hardware.
