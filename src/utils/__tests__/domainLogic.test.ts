import { assert, describe, it } from '../testHarness';
import {
  buildUsageDisplayState,
  calculateBrainrotIndex,
  calculateEarnedXpForDate,
  calculateLimitProgress,
  calculateTotalXp,
  claimDailyChestState,
  clampDailyLimitMinutes,
  clearLocalHistoryState,
  completeFocusBreakState,
  createInitialPersistedState,
  formatFreshnessLabel,
  formatMinutesAsHoursAndMinutes,
  getEffectiveDailyLimitMinutes,
  getMissionsForDate,
  MAX_DISPLAY_NAME_LENGTH,
  resolveEffectiveDisplayName,
  sanitizeDisplayName,
  selectCachedSummaryToPersist,
  STALE_THRESHOLD_MS,
  toggleMissionState,
  updateCustomDisplayNameState,
  updateDeviceDefaultNameState,
} from '../domainLogic';
import { getBadges } from '../../constants/data';
import { InstagramUsageSummary, PersistedAppState } from '../../constants/types';

describe('ROT Executive Demo - Domain Logic, User Identity & Data-State Tests', () => {
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

  it('AT-04 & AT-05: Computes daily limit progress, remaining time, and gentle nudges accurately', () => {
    assert.equal(clampDailyLimitMinutes(5), 15);
    assert.equal(clampDailyLimitMinutes(120), 120);
    assert.equal(clampDailyLimitMinutes(999), 720);

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

  it('AT-06: Guarantees mission completion and daily chest XP rewards are strictly idempotent', () => {
    const dateKey = '2026-11-14';
    const initial = createInitialPersistedState(dateKey);
    const startXp = calculateTotalXp(initial);

    const firstComplete = toggleMissionState(initial, 0, dateKey);
    assert.equal(firstComplete.xpAwarded, 40);
    assert.equal(calculateTotalXp(firstComplete.nextState), startXp + 40);

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
  });

  it('FR-009 & FR-021: Completes focus break, awards XP once per session, and unlocks Offline Icon badge', () => {
    const dateKey = '2026-11-14';
    const initial = createInitialPersistedState(dateKey);

    const breakRes = completeFocusBreakState(initial, 'session-abc', dateKey);
    assert.equal(breakRes.xpAwarded, 70);
    assert.equal(breakRes.nextState.completedFocusBreaks, 1);

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
  });

  it('FR-007: Computes Brainrot Index honestly when data is present vs. missing', () => {
    const missingIndex = calculateBrainrotIndex(null, 120, false, 1, 0);
    assert.equal(missingIndex.score, null);

    const healthyIndex = calculateBrainrotIndex(45 * 60 * 1000, 120, true, 2, 1);
    assert.ok(healthyIndex.score !== null && healthyIndex.score >= 70);

    const formatted = formatMinutesAsHoursAndMinutes(90);
    assert.equal(formatted.compact, '1h 30m');
    assert.equal(formatFreshnessLabel(1000, 1000 + 120_000), 'Fresh 2 min ago');
  });
});
