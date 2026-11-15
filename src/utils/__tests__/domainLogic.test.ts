import { assert, describe, it } from '../testHarness';
import {
  addLocalDays,
  buildUsageDisplayState,
  buildWeeklyAchievementSummary,
  calculateBrainrotIndex,
  calculateEarnedXpForDate,
  calculateLimitProgress,
  calculatePlayerLevel,
  calculateTotalXp,
  claimDailyChestState,
  claimWeeklyQuestState,
  clampDailyLimitMinutes,
  clearLocalHistoryState,
  completeFocusBreakState,
  createInitialPersistedState,
  evaluatePendingNotifications,
  evaluateStreakState,
  formatCardExportFilename,
  formatFreshnessLabel,
  formatMinutesAsHoursAndMinutes,
  formatUnreadBadgeCount,
  getEffectiveDailyLimitMinutes,
  getLocalWeekKey,
  getMissionsForDate,
  getWeeklyQuestState,
  getXpLedgerEntries,
  isWithinQuietHours,
  logDailyMoodState,
  MAX_DISPLAY_NAME_LENGTH,
  parseCustomDailyLimitInput,
  recoverStreakState,
  resolveEffectiveDisplayName,
  sanitizeDisplayName,
  selectCachedSummaryToPersist,
  serializeUserDataExportJson,
  STALE_THRESHOLD_MS,
  stepDailyLimitMinutes,
  syncUsageLinkedMissionsState,
  toggleMissionState,
  updateCustomDisplayNameState,
  updateDeviceDefaultNameState,
  verifyXpLedgerConsistency,
} from '../domainLogic';
import { getBadges } from '../../constants/data';
import { InstagramUsageSummary, PersistedAppState } from '../../constants/types';

describe('ROT Executive Demo & Core MVP - Domain Logic Test Suite', () => {
  it('Part B: Resolves device-name default, custom display name, blank-name validation, max length, and fallback', () => {
    const initial = createInitialPersistedState('2026-11-14', null);
    // 1. Fallback when neither custom nor device name exists
    const fallbackIdentity = resolveEffectiveDisplayName(initial.profile);
    assert.equal(fallbackIdentity.displayName, 'ROT User');
    assert.equal(fallbackIdentity.source, 'fallback');

    // 2. Device default name populated from Android native module
    const withDevice = updateDeviceDefaultNameState(initial, '  Redmi 11 Prime  ');
    const deviceIdentity = resolveEffectiveDisplayName(withDevice.profile);
    assert.equal(deviceIdentity.displayName, 'Redmi 11 Prime');
    assert.equal(deviceIdentity.source, 'device');
    assert.equal(deviceIdentity.initials, 'R');

    // 3. User sets custom display name (trimmed, max length enforced)
    const longInput = '   Ayla   Scrolls   Extra   Long   Name   Here   ';
    const sanitized = sanitizeDisplayName(longInput);
    assert.ok(sanitized !== null && sanitized.length <= MAX_DISPLAY_NAME_LENGTH);

    const customRes = updateCustomDisplayNameState(withDevice, '  Ayla  ');
    assert.equal(customRes.resolvedName, 'Ayla');
    assert.equal(customRes.revertedToDefault, false);
    const customIdentity = resolveEffectiveDisplayName(customRes.nextState.profile);
    assert.equal(customIdentity.displayName, 'Ayla');
    assert.equal(customIdentity.source, 'custom');
    assert.equal(customIdentity.initials, 'A');
    assert.equal(customIdentity.handle, 'ayla.resets');

    // 4. Blank / whitespace-only custom name reverts to device-name fallback
    const clearedRes = updateCustomDisplayNameState(customRes.nextState, '    ');
    assert.equal(clearedRes.revertedToDefault, true);
    assert.equal(clearedRes.resolvedName, 'Redmi 11 Prime');
    assert.equal(clearedRes.nextState.profile.customDisplayName, null);
  });

  it('Part C (1-4): Distinguishes permission missing, tracking paused, Instagram not installed, and empty OS record without ever showing 0h 00m', () => {
    const now = 1_700_000_600_000;
    const baseSummary: InstagramUsageSummary = {
      status: 'ok',
      statusReason: 'estimated Instagram foreground time',
      permissionGranted: true,
      instagramInstalled: true,
      todayForegroundMs: 90 * 60 * 1000,
      queriedAtMs: now,
      dailyBreakdown: [],
    };

    // 1. Permission missing / Consent pending
    const consentMissing = buildUsageDisplayState(baseSummary, 'pending', true, now);
    assert.equal(consentMissing.status, 'permission_required');
    assert.equal(consentMissing.hasVerifiedEstimate, false);
    assert.equal(consentMissing.hours, null);
    assert.equal(consentMissing.minutes, null);
    assert.equal(
      consentMissing.subtitleText,
      'ROT needs Usage Access to estimate your Instagram screen time.'
    );
    assert.equal(consentMissing.actionLabel, 'Grant permission');
    assert.equal(consentMissing.queryResult.estimatedMinutes, null);

    // Permission missing at OS level
    const permDeniedSummary: InstagramUsageSummary = {
      ...baseSummary,
      status: 'permission_required',
      permissionGranted: false,
      todayForegroundMs: null,
    };
    const permDenied = buildUsageDisplayState(permDeniedSummary, 'accepted', true, now);
    assert.equal(permDenied.status, 'permission_required');
    assert.equal(permDenied.hours, null);
    assert.equal(
      permDenied.subtitleText,
      'ROT needs Usage Access to estimate your Instagram screen time.'
    );
    assert.equal(permDenied.actionLabel, 'Grant permission');

    // 2. Tracking paused
    const paused = buildUsageDisplayState(baseSummary, 'accepted', false, now, baseSummary);
    assert.equal(paused.status, 'tracking_paused');
    assert.equal(paused.hasVerifiedEstimate, false);
    assert.equal(paused.hours, null);
    assert.equal(
      paused.subtitleText,
      'Tracking is paused. Your previous saved progress is preserved.'
    );
    assert.equal(paused.actionLabel, 'Resume tracking');
    assert.ok(paused.staleOrIncompleteWarning?.includes('preserved'));

    // 3. Instagram not installed
    const notInstalledSummary: InstagramUsageSummary = {
      ...baseSummary,
      status: 'not_installed',
      instagramInstalled: false,
      todayForegroundMs: null,
    };
    const notInstalled = buildUsageDisplayState(notInstalledSummary, 'accepted', true, now);
    assert.equal(notInstalled.status, 'not_installed');
    assert.equal(notInstalled.hasVerifiedEstimate, false);
    assert.equal(notInstalled.hours, null);
    assert.equal(notInstalled.subtitleText, "Instagram isn't installed on this device.");
    assert.equal(notInstalled.actionLabel, null);

    // 4. Empty OS result (no_os_record)
    const emptyOsSummary: InstagramUsageSummary = {
      ...baseSummary,
      status: 'no_os_record',
      todayForegroundMs: null,
    };
    const emptyOs = buildUsageDisplayState(emptyOsSummary, 'accepted', true, now);
    assert.equal(emptyOs.status, 'no_os_record');
    assert.equal(emptyOs.hasVerifiedEstimate, false);
    assert.equal(emptyOs.hours, null);
    assert.equal(
      emptyOs.subtitleText,
      'No usage record is available yet. Open Instagram and check again.'
    );
    assert.equal(emptyOs.actionLabel, 'Refresh');
  });

  it('Part C (5-9): Distinguishes successful zero usage, non-zero usage, query failure, stale/incomplete data, and permission revocation while running', () => {
    const now = new Date('2026-11-14T15:00:00').getTime();

    // 5. Successful zero usage (OS has events today, Instagram usage is 0m)
    const zeroSummary: InstagramUsageSummary = {
      status: 'zero_usage',
      statusReason: 'estimated Instagram foreground time',
      permissionGranted: true,
      instagramInstalled: true,
      todayForegroundMs: 0,
      todaySessionCount: 0,
      queriedAtMs: now - 60_000,
      aggregationSource: 'usage_events_zero',
      isComplete: true,
      dailyBreakdown: [],
    };
    const zeroDisplay = buildUsageDisplayState(zeroSummary, 'accepted', true, now);
    assert.equal(zeroDisplay.status, 'zero_usage');
    assert.equal(zeroDisplay.hasVerifiedEstimate, true);
    assert.equal(zeroDisplay.hours, 0);
    assert.equal(zeroDisplay.minutes, 0);
    assert.equal(zeroDisplay.queryResult.estimatedMinutes, 0);
    assert.equal(zeroDisplay.subtitleText, 'estimated Instagram foreground time');

    // 6. Successful non-zero usage (1h 30m)
    const activeSummary: InstagramUsageSummary = {
      status: 'ok',
      statusReason: 'estimated Instagram foreground time',
      permissionGranted: true,
      instagramInstalled: true,
      todayForegroundMs: 90 * 60 * 1000,
      todaySessionCount: 14,
      queriedAtMs: now - 120_000,
      aggregationSource: 'usage_events',
      isComplete: true,
      dailyBreakdown: [],
    };
    const activeDisplay = buildUsageDisplayState(activeSummary, 'accepted', true, now);
    assert.equal(activeDisplay.status, 'ok');
    assert.equal(activeDisplay.hasVerifiedEstimate, true);
    assert.equal(activeDisplay.hours, 1);
    assert.equal(activeDisplay.minutes, 30);
    assert.equal(activeDisplay.queryResult.estimatedMinutes, 90);
    assert.equal(activeDisplay.subtitleText, 'estimated Instagram foreground time');
    assert.ok(!activeDisplay.subtitleText.toLowerCase().includes('reel'));

    // 7. Native query failure preserves last successful estimate and shows warning
    const failedSummary: InstagramUsageSummary = {
      status: 'query_failed',
      statusReason:
        "We couldn't retrieve your usage data. Your previous saved data hasn't been deleted.",
      permissionGranted: true,
      instagramInstalled: true,
      todayForegroundMs: null,
      queriedAtMs: now,
      dailyBreakdown: [],
      isComplete: false,
      errorCode: 'QUERY_TIMEOUT',
    };
    const persistedCacheAfterFailure = selectCachedSummaryToPersist(
      activeSummary,
      failedSummary,
      'accepted',
      true
    );
    assert.equal(persistedCacheAfterFailure?.todayForegroundMs, 90 * 60 * 1000);

    const failedDisplay = buildUsageDisplayState(
      failedSummary,
      'accepted',
      true,
      now,
      persistedCacheAfterFailure
    );
    assert.equal(failedDisplay.status, 'query_failed');
    assert.equal(failedDisplay.hasVerifiedEstimate, false);
    assert.equal(failedDisplay.isShowingCachedFallback, true);
    assert.equal(failedDisplay.hours, 1);
    assert.equal(failedDisplay.minutes, 30);
    assert.equal(
      failedDisplay.subtitleText,
      "We couldn't retrieve your usage data. Your previous saved data hasn't been deleted."
    );
    assert.equal(failedDisplay.actionLabel, 'Try again');
    assert.ok(failedDisplay.staleOrIncompleteWarning?.includes('not current verified data'));

    // 8. Stale data (> 30m old)
    const staleSummary: InstagramUsageSummary = {
      ...activeSummary,
      queriedAtMs: now - (STALE_THRESHOLD_MS + 10 * 60 * 1000),
    };
    const staleDisplay = buildUsageDisplayState(staleSummary, 'accepted', true, now);
    assert.equal(staleDisplay.status, 'stale');
    assert.equal(staleDisplay.hasVerifiedEstimate, false);
    assert.equal(staleDisplay.isShowingCachedFallback, true);
    assert.equal(staleDisplay.hours, 1);
    assert.equal(staleDisplay.minutes, 30);
    assert.equal(staleDisplay.actionLabel, 'Refresh');
    assert.ok(staleDisplay.staleOrIncompleteWarning?.includes('Stale estimate'));

    // Incomplete data
    const incompleteSummary: InstagramUsageSummary = {
      ...activeSummary,
      status: 'incomplete',
      isComplete: false,
      aggregationSource: 'daily_aggregate',
    };
    const incompleteDisplay = buildUsageDisplayState(incompleteSummary, 'accepted', true, now);
    assert.equal(incompleteDisplay.status, 'incomplete');
    assert.equal(incompleteDisplay.hasVerifiedEstimate, false);
    assert.equal(incompleteDisplay.isShowingCachedFallback, true);
    assert.equal(incompleteDisplay.actionLabel, 'Refresh');
    assert.ok(incompleteDisplay.staleOrIncompleteWarning?.includes('Incomplete'));

    // 9. Permission revoked while running preserves cached summary
    const revokedSummary: InstagramUsageSummary = {
      status: 'permission_required',
      statusReason: 'ROT needs Usage Access to estimate your Instagram screen time.',
      permissionGranted: false,
      instagramInstalled: true,
      todayForegroundMs: null,
      queriedAtMs: now,
      dailyBreakdown: [],
      errorCode: 'PERMISSION_DENIED',
    };
    const cacheAfterRevoke = selectCachedSummaryToPersist(
      activeSummary,
      revokedSummary,
      'accepted',
      true
    );
    assert.equal(cacheAfterRevoke?.todayForegroundMs, 90 * 60 * 1000);
    const revokedDisplay = buildUsageDisplayState(
      revokedSummary,
      'accepted',
      true,
      now,
      cacheAfterRevoke
    );
    assert.equal(revokedDisplay.status, 'permission_required');
    assert.equal(revokedDisplay.hasVerifiedEstimate, false);
    assert.equal(revokedDisplay.hours, null);
    assert.equal(revokedDisplay.actionLabel, 'Grant permission');
    assert.ok(revokedDisplay.staleOrIncompleteWarning?.includes('Usage Access was revoked'));
  });

  it('AT-04, AT-05 & Core MVP #4: Computes daily limit progress, custom target validation/stepping, and gentle nudges', () => {
    assert.equal(clampDailyLimitMinutes(5), 15);
    assert.equal(clampDailyLimitMinutes(120), 120);
    assert.equal(clampDailyLimitMinutes(999), 720);

    // Stepper & custom input validation
    assert.equal(stepDailyLimitMinutes(120, -5), 115);
    assert.equal(stepDailyLimitMinutes(15, -10), 15);
    assert.equal(stepDailyLimitMinutes(720, 10), 720);

    const validCustom = parseCustomDailyLimitInput('75');
    assert.equal(validCustom.valid, true);
    assert.equal(validCustom.minutes, 75);

    const invalidLow = parseCustomDailyLimitInput('10');
    assert.equal(invalidLow.valid, false);
    assert.ok(invalidLow.error?.includes('between 15m and 720m'));

    const invalidNonNumeric = parseCustomDailyLimitInput('1h30m');
    assert.equal(invalidNonNumeric.valid, false);

    const normalProgress = calculateLimitProgress(90 * 60 * 1000, 120, true);
    assert.equal(normalProgress.limitFormatted, '2h 00m');
    assert.equal(normalProgress.remainingFormatted, '30 min left');
    assert.equal(normalProgress.progressPercent, 75);
    assert.equal(normalProgress.isNearLimit, false);
    assert.equal(normalProgress.isOverLimit, false);
    assert.equal(normalProgress.nudgeMessage, null);

    const nearProgress = calculateLimitProgress(102 * 60 * 1000, 120, true);
    assert.equal(nearProgress.isNearLimit, true);
    assert.equal(nearProgress.isOverLimit, false);
    assert.ok(nearProgress.nudgeMessage?.includes('18 min left'));

    const overProgress = calculateLimitProgress(135 * 60 * 1000, 120, true);
    assert.equal(overProgress.isOverLimit, true);
    assert.equal(overProgress.progressPercent, 100);
    assert.equal(overProgress.remainingFormatted, '15 min over target');
    assert.ok(overProgress.nudgeMessage?.includes('No guilt'));

    const saturday = new Date('2026-11-14T10:00:00');
    assert.equal(getEffectiveDailyLimitMinutes(120, true, saturday), 150);
    assert.equal(getEffectiveDailyLimitMinutes(120, false, saturday), 120);
  });

  it('AT-06 & Core MVP #7: Guarantees mission/chest XP idempotency and 100% XP Ledger consistency', () => {
    const dateKey = '2026-11-14';
    const initial = createInitialPersistedState(dateKey);
    const startXp = calculateTotalXp(initial);
    assert.equal(verifyXpLedgerConsistency(initial).consistent, true);

    const firstComplete = toggleMissionState(initial, 0, dateKey);
    assert.equal(firstComplete.xpAwarded, 40);
    assert.equal(calculateTotalXp(firstComplete.nextState), startXp + 40);
    assert.equal(verifyXpLedgerConsistency(firstComplete.nextState).consistent, true);

    const duplicateForceComplete = toggleMissionState(
      firstComplete.nextState,
      0,
      dateKey,
      true
    );
    assert.equal(duplicateForceComplete.xpAwarded, 0);
    assert.equal(calculateTotalXp(duplicateForceComplete.nextState), startXp + 40);

    const reopened = toggleMissionState(firstComplete.nextState, 0, dateKey);
    const reCompleted = toggleMissionState(reopened.nextState, 0, dateKey);
    assert.equal(reCompleted.xpAwarded, 0);
    assert.equal(calculateTotalXp(reCompleted.nextState), startXp + 40);
    assert.equal(calculateEarnedXpForDate(reCompleted.nextState, dateKey), 40);

    const chestDate = new Date('2026-11-14T12:00:00');
    const firstChest = claimDailyChestState(reCompleted.nextState, chestDate);
    assert.equal(firstChest.xpAwarded, 50);
    const secondChest = claimDailyChestState(firstChest.nextState, chestDate);
    assert.equal(secondChest.xpAwarded, 0);
    assert.equal(calculateTotalXp(secondChest.nextState), startXp + 40 + 50);

    const consistency = verifyXpLedgerConsistency(secondChest.nextState);
    assert.equal(consistency.consistent, true);
    assert.equal(consistency.totalXp, startXp + 90);
    assert.equal(consistency.ledgerSum, startXp + 90);
    assert.equal(getXpLedgerEntries(secondChest.nextState).length, 3); // 2 earned + 1 baseline
  });

  it('FR-009 & FR-021: Completes focus break, awards XP once per session, and unlocks Offline Icon badge', () => {
    const dateKey = '2026-11-14';
    const initial = createInitialPersistedState(dateKey);

    const breakRes = completeFocusBreakState(initial, 'session-abc', dateKey);
    assert.equal(breakRes.xpAwarded, 70);
    assert.equal(breakRes.nextState.completedFocusBreaks, 1);
    assert.equal(verifyXpLedgerConsistency(breakRes.nextState).consistent, true);

    const missionsAfterBreak = getMissionsForDate(breakRes.nextState, dateKey);
    const badges = getBadges(
      missionsAfterBreak,
      breakRes.nextState.completedFocusBreaks,
      breakRes.nextState.unlockedBadges
    );
    const offlineIcon = badges.find((b) => b.id === 'offline-icon');
    assert.equal(offlineIcon?.unlocked, true);

    const duplicateBreak = completeFocusBreakState(
      breakRes.nextState,
      'session-abc',
      dateKey
    );
    assert.equal(duplicateBreak.xpAwarded, 0);
    assert.equal(duplicateBreak.nextState.completedFocusBreaks, 1);
  });

  it('Core MVP #1: Streak & Grace-Day Engine handles consecutive days, grace-day consumption, streak break, recovery, and weekly reset', () => {
    const day1 = '2026-11-09'; // Monday
    const day2 = addLocalDays(day1, 1); // Tuesday
    const day3 = addLocalDays(day1, 2); // Wednesday
    const day4 = addLocalDays(day1, 3); // Thursday
    const day5 = addLocalDays(day1, 4); // Friday

    let state = createInitialPersistedState(day1);
    state = { ...state, consentStatus: 'accepted', trackingEnabled: true };
    // Day 1: Complete mission 0 ("Touch some grass")
    state = toggleMissionState(state, 0, day1).nextState;
    assert.equal(state.streak.currentStreak, 1);
    assert.equal(state.streak.graceDaysRemaining, 1);

    // Day 2: Complete mission 0 -> streak becomes 2
    state = toggleMissionState(state, 0, day2).nextState;
    assert.equal(state.streak.currentStreak, 2);
    assert.equal(state.streak.longestStreak, 2);

    // Day 3 is missed (no activity), evaluate on Day 4 -> consumes 1 Grace Day and preserves streak = 2
    state = evaluateStreakState(state, day4);
    assert.equal(state.streak.graceDaysRemaining, 0);
    assert.equal(state.streak.historyByDate[day3], 'grace_used');
    assert.equal(state.streak.currentStreak, 2);
    assert.equal(state.streak.recoveryNeeded, false);

    // Day 4 is also missed (graceDaysRemaining is now 0), evaluate on Day 5 -> streak breaks!
    state = evaluateStreakState(state, day5);
    assert.equal(state.streak.historyByDate[day4], 'missed');
    assert.equal(state.streak.currentStreak, 0);
    assert.equal(state.streak.recoveryNeeded, true);
    assert.equal(state.streak.previousStreakBeforeBreak, 2);

    // Attempt recovery before doing an action on Day 5 -> blocked
    const prematureRecovery = recoverStreakState(state, day5);
    assert.equal(prematureRecovery.xpAwarded, 0);
    assert.equal(prematureRecovery.nextState.streak.recoveryNeeded, true);

    // Complete a mission on Day 5, then recover streak -> restores previousStreak (2) + today (1) = 3, awards +25 XP
    state = toggleMissionState(state, 0, day5).nextState;
    const recovered = recoverStreakState(state, day5);
    assert.equal(recovered.xpAwarded, 25);
    assert.equal(recovered.nextState.streak.currentStreak, 3);
    assert.equal(recovered.nextState.streak.recoveryNeeded, false);
    assert.equal(recovered.nextState.streak.recoveredThisWeek, true);
    assert.equal(verifyXpLedgerConsistency(recovered.nextState).consistent, true);

    // Next Monday resets graceDaysRemaining to 1
    const nextMonday = '2026-11-16';
    assert.ok(getLocalWeekKey(day1) !== getLocalWeekKey(nextMonday));
    const nextWeekState = toggleMissionState(recovered.nextState, 0, nextMonday).nextState;
    assert.equal(nextWeekState.streak.graceDaysRemaining, 1);
    assert.equal(nextWeekState.streak.recoveredThisWeek, false);
  });

  it('Core MVP #2: Usage-Linked Missions auto-complete from verified usage and reject fake progress when permission is missing', () => {
    const dateKey = '2026-11-14';
    const now = new Date('2026-11-14T16:00:00').getTime();
    let state = createInitialPersistedState(dateKey);

    // 1. Missing permission -> does not auto-complete, manual click is blocked
    const missingDisplay = buildUsageDisplayState(null, 'pending', true, now);
    const syncMissing = syncUsageLinkedMissionsState(state, missingDisplay, 120, dateKey);
    assert.equal(syncMissing.xpAwarded, 0);

    const missionsMissing = getMissionsForDate(state, dateKey, missingDisplay, 120);
    const stayUnderIdx = missionsMissing.findIndex((m) => m.id === 'stay-under-target');
    assert.equal(missionsMissing[stayUnderIdx].done, false);
    assert.equal(missionsMissing[stayUnderIdx].progressLabel, 'Requires Usage Access');

    const manualAttempt = toggleMissionState(
      state,
      stayUnderIdx,
      dateKey,
      false,
      missingDisplay,
      120
    );
    assert.equal(manualAttempt.xpAwarded, 0);
    assert.ok(manualAttempt.toastMessage.includes('Grant Usage Access'));

    // 2. Verified usage within target (45m <= 120m) -> auto-completes and awards +45 XP once
    state = { ...state, consentStatus: 'accepted', trackingEnabled: true };
    const verifiedUnderSummary: InstagramUsageSummary = {
      status: 'ok',
      statusReason: 'estimated Instagram foreground time',
      permissionGranted: true,
      instagramInstalled: true,
      todayForegroundMs: 45 * 60 * 1000,
      queriedAtMs: now,
      dailyBreakdown: [],
      isComplete: true,
    };
    const verifiedDisplay = buildUsageDisplayState(
      verifiedUnderSummary,
      'accepted',
      true,
      now
    );
    const autoSynced = syncUsageLinkedMissionsState(
      state,
      verifiedDisplay,
      120,
      dateKey
    );
    assert.equal(autoSynced.xpAwarded, 45);
    const updatedMissions = getMissionsForDate(
      autoSynced.nextState,
      dateKey,
      verifiedDisplay,
      120
    );
    assert.equal(updatedMissions[stayUnderIdx].done, true);

    // Duplicate sync awards 0 XP
    const secondSync = syncUsageLinkedMissionsState(
      autoSynced.nextState,
      verifiedDisplay,
      120,
      dateKey
    );
    assert.equal(secondSync.xpAwarded, 0);
  });

  it('Core MVP #3: Weekly Quests track progress across the week, award completion XP idempotently, and reset on a new week', () => {
    const mon = '2026-11-09';
    const tue = '2026-11-10';
    const wed = '2026-11-11';
    let state = createInitialPersistedState(mon);

    // Complete 1 mission on Mon, Tue, Wed -> completes 'balanced-week' (target: 3)
    state = toggleMissionState(state, 0, mon).nextState;
    state = toggleMissionState(state, 0, tue).nextState;

    let weekly = getWeeklyQuestState(state, tue);
    const balancedBefore = weekly.quests.find((q) => q.id === 'balanced-week')!;
    assert.equal(balancedBefore.progress, 2);
    assert.equal(balancedBefore.completed, false);

    // Claiming before completion awards 0 XP
    const prematureClaim = claimWeeklyQuestState(state, 'balanced-week', tue);
    assert.equal(prematureClaim.xpAwarded, 0);

    state = toggleMissionState(state, 0, wed).nextState;
    weekly = getWeeklyQuestState(state, wed);
    const balancedAfter = weekly.quests.find((q) => q.id === 'balanced-week')!;
    assert.equal(balancedAfter.progress, 3);
    assert.equal(balancedAfter.completed, true);

    // Claim reward (+90 XP)
    const claimRes = claimWeeklyQuestState(state, 'balanced-week', wed);
    assert.equal(claimRes.xpAwarded, 90);
    assert.equal(verifyXpLedgerConsistency(claimRes.nextState).consistent, true);

    // Duplicate claim in same week awards 0 XP
    const dupClaim = claimWeeklyQuestState(claimRes.nextState, 'balanced-week', wed);
    assert.equal(dupClaim.xpAwarded, 0);

    // New week resets quest progress to 0
    const nextWeekMon = '2026-11-16';
    const nextWeekQuests = getWeeklyQuestState(claimRes.nextState, nextWeekMon);
    assert.ok(nextWeekQuests.weekKey !== weekly.weekKey);
    assert.equal(
      nextWeekQuests.quests.find((q) => q.id === 'balanced-week')?.progress,
      0
    );
    assert.equal(
      nextWeekQuests.quests.find((q) => q.id === 'balanced-week')?.claimed,
      false
    );
  });

  it('Core MVP #5, #6 & #8: Evaluates local notifications, logs daily mood with Brainrot breakdown, and exports valid JSON', () => {
    const dateKey = '2026-11-14';
    const now = new Date('2026-11-14T19:00:00').getTime();
    let state = createInitialPersistedState(dateKey, 'Redmi 11 Prime');
    state = { ...state, consentStatus: 'accepted', trackingEnabled: true };

    // 1. Mood logging completes brain-check-in (+25 XP) and updates Brainrot Index mood
    const moodRes = logDailyMoodState(
      state,
      'curious',
      'Reading 20 pages tonight',
      dateKey
    );
    assert.equal(moodRes.xpAwarded, 25);
    state = moodRes.nextState;
    assert.equal(state.moodLogsByDate[dateKey]?.label, 'Chill but curious');
    assert.equal(state.moodLogsByDate[dateKey]?.note, 'Reading 20 pages tonight');

    const indexWithMood = calculateBrainrotIndex(
      45 * 60 * 1000,
      120,
      true,
      2,
      1,
      state.moodLogsByDate[dateKey]
    );
    assert.ok(indexWithMood.score !== null && indexWithMood.score >= 70);
    assert.equal(indexWithMood.moodValue, 'Chill but curious');
    assert.equal(indexWithMood.breakdown.missionBonus, 8);
    assert.equal(indexWithMood.breakdown.focusBreakBonus, 3);
    assert.equal(indexWithMood.breakdown.usageRatioPercent, 38);

    // 2. Local notification evaluation (near limit 85% -> fires limit_80 once, never duplicates)
    const summary85: InstagramUsageSummary = {
      status: 'ok',
      statusReason: 'estimated Instagram foreground time',
      permissionGranted: true,
      instagramInstalled: true,
      todayForegroundMs: 102 * 60 * 1000,
      queriedAtMs: now,
      dailyBreakdown: [],
      isComplete: true,
    };
    const display85 = buildUsageDisplayState(summary85, 'accepted', true, now);
    const progress85 = calculateLimitProgress(
      summary85.todayForegroundMs,
      120,
      display85.hasVerifiedEstimate
    );

    const firstEval = evaluatePendingNotifications(
      state,
      display85,
      progress85,
      dateKey,
      19
    );
    assert.equal(
      firstEval.notifications.some((n) => n.category === 'limit_80'),
      true
    );

    const secondEval = evaluatePendingNotifications(
      firstEval.nextState,
      display85,
      progress85,
      dateKey,
      19
    );
    assert.equal(secondEval.notifications.length, 0);

    // 3. Structured JSON Export validation
    const exportRes = serializeUserDataExportJson(firstEval.nextState, '2026-11-14T19:05:00.000Z');
    assert.equal(exportRes.ok, true);
    assert.equal(exportRes.filename, 'rot-brainrot-export-2026-11-14.json');
    const parsedExport = JSON.parse(exportRes.json);
    assert.equal(parsedExport.format, 'rot-user-data-export-v1');
    assert.equal(parsedExport.profile.effectiveDisplayName, 'Redmi 11 Prime');
    assert.equal(parsedExport.xpSummary.ledgerConsistent, true);
    assert.equal(
      parsedExport.moodLogsByDate[dateKey].note,
      'Reading 20 pages tonight'
    );
  });

  it('AT-08 & Cold-Restart Serialization: Preserves custom profile, consent, and XP across JSON serialization and clears local history cleanly', () => {
    const dateKey = '2026-11-14';
    let state = createInitialPersistedState(dateKey, 'Redmi 11 Prime');
    state = updateCustomDisplayNameState(state, 'Nadia').nextState;
    state = {
      ...state,
      consentStatus: 'accepted',
      dailyLimitMinutes: 90,
      cachedUsageSummary: {
        status: 'ok',
        statusReason: 'ok',
        permissionGranted: true,
        instagramInstalled: true,
        todayForegroundMs: 60_000,
        queriedAtMs: Date.now(),
        dailyBreakdown: [],
      },
    };
    state = toggleMissionState(state, 0, dateKey).nextState;

    // Simulate AsyncStorage cold-restart round-trip
    const serialized = JSON.stringify(state);
    const rehydrated = JSON.parse(serialized) as PersistedAppState;
    assert.equal(resolveEffectiveDisplayName(rehydrated.profile).displayName, 'Nadia');
    assert.equal(rehydrated.dailyLimitMinutes, 90);
    assert.equal(calculateTotalXp(rehydrated), 284 + 40);

    // Clear local history preserves consent, limit, and profile name
    const cleared = clearLocalHistoryState(rehydrated, dateKey);
    assert.equal(cleared.consentStatus, 'accepted');
    assert.equal(cleared.dailyLimitMinutes, 90);
    assert.equal(resolveEffectiveDisplayName(cleared.profile).displayName, 'Nadia');
    assert.equal(cleared.cachedUsageSummary, null);
    assert.equal(cleared.completedFocusBreaks, 0);
    assert.deepEqual(cleared.claimedXpEvents, {});
    assert.deepEqual(cleared.unlockedBadges, {});
    assert.deepEqual(cleared.moodLogsByDate, {});
    assert.deepEqual(cleared.xpLedger, []);
  });

  it('FR-007: Computes Brainrot Index honestly when data is present vs. missing', () => {
    const missingIndex = calculateBrainrotIndex(null, 120, false, 1, 0);
    assert.equal(missingIndex.score, null);
    assert.equal(missingIndex.breakdown.finalScore, null);

    const healthyIndex = calculateBrainrotIndex(45 * 60 * 1000, 120, true, 2, 1);
    assert.ok(healthyIndex.score !== null && healthyIndex.score >= 70);

    const formatted = formatMinutesAsHoursAndMinutes(90);
    assert.equal(formatted.compact, '1h 30m');
    assert.equal(formatFreshnessLabel(1000, 1000 + 120_000), 'Fresh 2 min ago');

    // Capped at 99 breakdown note
    const cappedIndex = calculateBrainrotIndex(0, 120, true, 2, 1);
    assert.equal(cappedIndex.score, 99);
    assert.ok(cappedIndex.breakdown.summaryText.includes('(capped at 99)'));
  });

  it('PR #2.1: Evaluates quiet hours, configurable reminder hours, and focus break duration ledger titles', () => {
    const dateKey = '2026-11-14';
    let state = createInitialPersistedState(dateKey, 'Redmi 11 Prime');
    state = {
      ...state,
      consentStatus: 'accepted',
      trackingEnabled: true,
      settings: {
        ...state.settings,
        quietHoursEnabled: true,
        quietStartHour: 22,
        quietEndHour: 8,
        eveningReminderHour: 18,
        streakReminderHour: 20,
      },
    };

    // Overnight quiet hours check (22 -> 8)
    assert.equal(isWithinQuietHours(state.settings, 23), true);
    assert.equal(isWithinQuietHours(state.settings, 7), true);
    assert.equal(isWithinQuietHours(state.settings, 19), false);

    // Same-day quiet hours check (13 -> 15)
    assert.equal(
      isWithinQuietHours(
        { ...state.settings, quietStartHour: 13, quietEndHour: 15 },
        14
      ),
      true
    );
    assert.equal(
      isWithinQuietHours({ ...state.settings, quietHoursEnabled: false }, 23),
      false
    );

    const now = new Date('2026-11-14T18:30:00').getTime();
    const summary: InstagramUsageSummary = {
      status: 'ok',
      statusReason: 'estimated Instagram foreground time',
      permissionGranted: true,
      instagramInstalled: true,
      todayForegroundMs: 105 * 60 * 1000,
      queriedAtMs: now,
      dailyBreakdown: [],
      isComplete: true,
    };
    const display = buildUsageDisplayState(summary, 'accepted', true, now);
    const progress = calculateLimitProgress(summary.todayForegroundMs, 120, true);

    // Suppressed during quiet hours (22:00)
    const quietEval = evaluatePendingNotifications(state, display, progress, dateKey, 22);
    assert.equal(quietEval.notifications.length, 0);

    // Fires configurable evening mission reminder at hour 18
    const eveningEval = evaluatePendingNotifications(state, display, progress, dateKey, 18);
    assert.equal(
      eveningEval.notifications.some((n) => n.category === 'mission_reminder'),
      true
    );

    // Focus break duration parameter updates ledger title
    const break1m = completeFocusBreakState(state, 'demo-session', dateKey, 1);
    const ledger = getXpLedgerEntries(break1m.nextState);
    assert.equal(
      ledger.some((entry) => entry.title === '1-Minute Focus Break'),
      true
    );
  });

  it('PR #2.1: Computes player level, export PNG filenames, and honest Weekly Achievement summaries', () => {
    const level4 = calculatePlayerLevel(340);
    assert.equal(level4.level, 4);
    assert.equal(level4.title, 'Mindful Scroller');
    assert.equal(level4.progressPercent, 40);

    assert.equal(
      formatCardExportFilename('archetype', 'Pramit @ROT!', '2026-11-15', 'feed'),
      'ROT_Archetype_Pramit_ROT_20261115.png'
    );
    assert.equal(
      formatCardExportFilename('weekly', 'Ayla', '2026-11-15', 'story'),
      'ROT_Weekly_Achievement_Ayla_20261115_Story.png'
    );

    // Honest zero-progress weekly summary after clearLocalHistoryState
    const monday = '2026-11-09';
    const clean = clearLocalHistoryState(createInitialPersistedState(monday), monday);
    const emptyWeekly = buildWeeklyAchievementSummary(clean, monday);
    assert.equal(emptyWeekly.hasAnyProgress, false);
    assert.equal(emptyWeekly.weeklyXpEarned, 0);
    assert.equal(emptyWeekly.heroMetricValue, '0 XP');

    // Active week summary reflects real XP and mission count
    let active = toggleMissionState(clean, 0, monday).nextState;
    active = completeFocusBreakState(active, 'b1', monday, 5).nextState;
    const activeWeekly = buildWeeklyAchievementSummary(active, monday);
    assert.equal(activeWeekly.hasAnyProgress, true);
    assert.ok(activeWeekly.weeklyXpEarned >= 70);
    assert.ok(activeWeekly.missionsCompletedThisWeek >= 1);
  });

  it('PR #2.1 Final UX: Formats unread notification badge counts with 0 hidden and 99+ cap', () => {
    assert.equal(formatUnreadBadgeCount(0), null);
    assert.equal(formatUnreadBadgeCount(-3), null);
    assert.equal(formatUnreadBadgeCount(Number.NaN), null);
    assert.equal(formatUnreadBadgeCount(1), '1');
    assert.equal(formatUnreadBadgeCount(14), '14');
    assert.equal(formatUnreadBadgeCount(99), '99');
    assert.equal(formatUnreadBadgeCount(100), '99+');
    assert.equal(formatUnreadBadgeCount(245), '99+');
  });
});
