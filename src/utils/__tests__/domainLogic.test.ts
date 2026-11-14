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
  toggleMissionState,
} from '../domainLogic';
import { getBadges } from '../../constants/data';
import { InstagramUsageSummary } from '../../constants/types';

describe('ROT Executive Demo - Domain Logic & SRS Acceptance Tests', () => {
  it('AT-01 & AT-03: Never presents missing, denied, or paused usage data as 0m', () => {
    const sampleOkSummary: InstagramUsageSummary = {
      status: 'ok',
      statusReason: 'Estimated foreground time calculated from Android UsageStats.',
      permissionGranted: true,
      instagramInstalled: true,
      todayForegroundMs: 90 * 60 * 1000,
      queriedAtMs: 1_700_000_000_000,
      dailyBreakdown: [],
    };

    // 1. Consent pending
    const pendingConsent = buildUsageDisplayState(sampleOkSummary, 'pending', true);
    assert.equal(pendingConsent.hasVerifiedEstimate, false);
    assert.equal(pendingConsent.hours, null);
    assert.equal(pendingConsent.minutes, null);
    assert.equal(pendingConsent.headlineText, 'Setup needed');

    // 2. Tracking paused by user
    const paused = buildUsageDisplayState(sampleOkSummary, 'accepted', false);
    assert.equal(paused.hasVerifiedEstimate, false);
    assert.equal(paused.hours, null);
    assert.equal(paused.headlineText, 'Tracking paused');

    // 3. Android Usage Access denied
    const deniedSummary: InstagramUsageSummary = {
      ...sampleOkSummary,
      status: 'permission_required',
      permissionGranted: false,
      todayForegroundMs: null,
    };
    const denied = buildUsageDisplayState(deniedSummary, 'accepted', true);
    assert.equal(denied.hasVerifiedEstimate, false);
    assert.equal(denied.hours, null);
    assert.equal(denied.headlineText, 'Access needed');

    // 4. OS records unavailable
    const unavailableSummary: InstagramUsageSummary = {
      ...sampleOkSummary,
      status: 'unavailable',
      todayForegroundMs: null,
    };
    const unavailable = buildUsageDisplayState(unavailableSummary, 'accepted', true);
    assert.equal(unavailable.hasVerifiedEstimate, false);
    assert.equal(unavailable.hours, null);
    assert.equal(unavailable.headlineText, 'Unavailable');
  });

  it('AT-02 & AT-11: Labels verified UsageStats data as estimated foreground time and never claims exact Reel counts', () => {
    const now = 1_700_000_600_000;
    const summary: InstagramUsageSummary = {
      status: 'ok',
      statusReason: 'Estimated foreground time calculated from Android UsageStats.',
      permissionGranted: true,
      instagramInstalled: true,
      todayForegroundMs: 90 * 60 * 1000, // 1h 30m
      todaySessionCount: 10,
      queriedAtMs: now - 5 * 60 * 1000,
      dailyBreakdown: [],
    };

    const display = buildUsageDisplayState(summary, 'accepted', true, now);
    assert.equal(display.hasVerifiedEstimate, true);
    assert.equal(display.hours, 1);
    assert.equal(display.minutes, 30);
    assert.equal(display.subtitleText, 'estimated Instagram foreground time');
    assert.ok(!display.subtitleText.toLowerCase().includes('reel'));
    assert.equal(display.freshnessText, 'Fresh 5 min ago');
  });

  it('AT-04 & AT-05: Computes daily limit progress, remaining time, and gentle nudges accurately', () => {
    assert.equal(clampDailyLimitMinutes(5), 15);
    assert.equal(clampDailyLimitMinutes(120), 120);
    assert.equal(clampDailyLimitMinutes(999), 720);

    // 90m used against 120m limit -> 75% used, 30 min left
    const normalProgress = calculateLimitProgress(90 * 60 * 1000, 120, true);
    assert.equal(normalProgress.limitFormatted, '2h 00m');
    assert.equal(normalProgress.remainingFormatted, '30 min left');
    assert.equal(normalProgress.progressPercent, 75);
    assert.equal(normalProgress.isNearLimit, false);
    assert.equal(normalProgress.isOverLimit, false);
    assert.equal(normalProgress.nudgeMessage, null);

    // 102m used against 120m limit -> 85% used (near limit)
    const nearProgress = calculateLimitProgress(102 * 60 * 1000, 120, true);
    assert.equal(nearProgress.isNearLimit, true);
    assert.equal(nearProgress.isOverLimit, false);
    assert.ok(nearProgress.nudgeMessage?.includes('18 min left'));

    // 135m used against 120m limit -> over limit
    const overProgress = calculateLimitProgress(135 * 60 * 1000, 120, true);
    assert.equal(overProgress.isOverLimit, true);
    assert.equal(overProgress.progressPercent, 100);
    assert.equal(overProgress.remainingFormatted, '15 min over target');
    assert.ok(overProgress.nudgeMessage?.includes('No guilt'));

    // Weekend breathing room adds +30m on Saturday/Sunday
    const saturday = new Date('2026-11-14T10:00:00');
    assert.equal(getEffectiveDailyLimitMinutes(120, true, saturday), 150);
    assert.equal(getEffectiveDailyLimitMinutes(120, false, saturday), 120);
  });

  it('AT-06: Guarantees mission completion and daily chest XP rewards are strictly idempotent', () => {
    const dateKey = '2026-11-14';
    const initial = createInitialPersistedState(dateKey);
    const startXp = calculateTotalXp(initial);

    // Complete mission 0 ("Touch some grass", +40 XP)
    const firstComplete = toggleMissionState(initial, 0, dateKey);
    assert.equal(firstComplete.xpAwarded, 40);
    assert.equal(calculateTotalXp(firstComplete.nextState), startXp + 40);

    // Force-complete mission 0 again on the same day -> 0 XP awarded
    const duplicateForceComplete = toggleMissionState(
      firstComplete.nextState,
      0,
      dateKey,
      true
    );
    assert.equal(duplicateForceComplete.xpAwarded, 0);
    assert.equal(calculateTotalXp(duplicateForceComplete.nextState), startXp + 40);

    // Uncheck (reopen) mission 0 and re-complete on the same day -> still 0 additional XP
    const reopened = toggleMissionState(firstComplete.nextState, 0, dateKey);
    const reCompleted = toggleMissionState(reopened.nextState, 0, dateKey);
    assert.equal(reCompleted.xpAwarded, 0);
    assert.equal(calculateTotalXp(reCompleted.nextState), startXp + 40);
    assert.equal(calculateEarnedXpForDate(reCompleted.nextState, dateKey), 40);

    // Claim daily chest twice on the same day -> +50 XP only once
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
    // Awards +30 XP for break AND +40 XP for auto-completing "Touch some grass"
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

    // Calling completeFocusBreakState with the same sessionId is idempotent
    const duplicateBreak = completeFocusBreakState(
      breakRes.nextState,
      'session-abc',
      dateKey
    );
    assert.equal(duplicateBreak.xpAwarded, 0);
    assert.equal(duplicateBreak.nextState.completedFocusBreaks, 1);
  });

  it('AT-08: Clears local usage cache and activity history while preserving consent and settings', () => {
    const dateKey = '2026-11-14';
    let state = createInitialPersistedState(dateKey);
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

    const cleared = clearLocalHistoryState(state, dateKey);
    assert.equal(cleared.consentStatus, 'accepted');
    assert.equal(cleared.dailyLimitMinutes, 90);
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
