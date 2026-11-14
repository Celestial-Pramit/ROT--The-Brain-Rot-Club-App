import { dailyItems, getBadges, initialMissions } from '../constants/data';
import {
  Badge,
  Celebration,
  ConsentStatus,
  DailyChest,
  InstagramUsageSummary,
  Mission,
  PersistedAppState,
  UsageDataStatus,
} from '../constants/types';

export const DEFAULT_BASE_XP = 284;
export const DEFAULT_DAILY_LIMIT_MINUTES = 120;
export const FOCUS_BREAK_XP_REWARD = 30;
export const DAILY_CHEST_XP_REWARD = 50;

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatReadableDateHeader(date: Date = new Date()): string {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const months = [
    'JANUARY',
    'FEBRUARY',
    'MARCH',
    'APRIL',
    'MAY',
    'JUNE',
    'JULY',
    'AUGUST',
    'SEPTEMBER',
    'OCTOBER',
    'NOVEMBER',
    'DECEMBER',
  ];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

export function getGreetingForHour(hour: number = new Date().getHours()): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function clampDailyLimitMinutes(minutes: number): number {
  if (!Number.isFinite(minutes)) return DEFAULT_DAILY_LIMIT_MINUTES;
  return Math.max(15, Math.min(720, Math.round(minutes)));
}

export function getEffectiveDailyLimitMinutes(
  dailyLimitMinutes: number,
  weekendBreathingRoom: boolean,
  date: Date = new Date()
): number {
  const base = clampDailyLimitMinutes(dailyLimitMinutes);
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6;
  return isWeekend && weekendBreathingRoom ? base + 30 : base;
}

export function formatMinutesAsHoursAndMinutes(totalMinutes: number): {
  hours: number;
  minutes: number;
  compact: string;
} {
  const safeMinutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  const compact =
    hours > 0
      ? `${hours}h ${String(minutes).padStart(2, '0')}m`
      : `${minutes}m`;
  return { hours, minutes, compact };
}

export function formatFreshnessLabel(queriedAtMs: number | null | undefined, nowMs: number = Date.now()): string {
  if (!queriedAtMs || queriedAtMs <= 0) {
    return 'Not synced yet';
  }
  const diffMinutes = Math.max(0, Math.floor((nowMs - queriedAtMs) / 60000));
  if (diffMinutes < 1) return 'Fresh just now';
  if (diffMinutes === 1) return 'Fresh 1 min ago';
  if (diffMinutes < 60) return `Fresh ${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  return `Updated ${diffHours}h ago`;
}

export type UsageDisplayState = {
  status: UsageDataStatus;
  hasVerifiedEstimate: boolean;
  hours: number | null;
  minutes: number | null;
  headlineText: string | null;
  subtitleText: string;
  freshnessText: string;
  badgeDotColor: string;
  actionLabel: string | null;
  actionKind: 'consent' | 'permission' | 'enable_tracking' | 'refresh' | null;
};

/**
 * Maps raw UsageStats + user consent/settings into an honest display model.
 * Strictly obeys SRS rules:
 * - Never presents missing/denied/unavailable usage data as 0m (BT-04, AT-03).
 * - Explicitly labels verified usage as estimated Instagram foreground time, never exact Reel counts (BT-02, BT-03, AT-11).
 */
export function buildUsageDisplayState(
  summary: InstagramUsageSummary | null,
  consentStatus: ConsentStatus,
  trackingEnabled: boolean,
  nowMs: number = Date.now()
): UsageDisplayState {
  if (consentStatus !== 'accepted') {
    return {
      status: 'tracking_disabled',
      hasVerifiedEstimate: false,
      hours: null,
      minutes: null,
      headlineText: 'Setup needed',
      subtitleText:
        'Review how ROT estimates Instagram foreground time to enable usage tracking.',
      freshnessText: 'Consent required',
      badgeDotColor: '#ffd640',
      actionLabel: 'Review & Enable Tracking',
      actionKind: 'consent',
    };
  }

  if (!trackingEnabled) {
    return {
      status: 'tracking_disabled',
      hasVerifiedEstimate: false,
      hours: null,
      minutes: null,
      headlineText: 'Tracking paused',
      subtitleText:
        'Usage tracking is turned off in Settings. Your dashboard will not record or show 0m while paused.',
      freshnessText: 'Paused by you',
      badgeDotColor: '#ffd640',
      actionLabel: 'Resume Tracking',
      actionKind: 'enable_tracking',
    };
  }

  if (!summary || summary.status === 'permission_required' || !summary.permissionGranted) {
    return {
      status: 'permission_required',
      hasVerifiedEstimate: false,
      hours: null,
      minutes: null,
      headlineText: 'Access needed',
      subtitleText:
        'Android Usage Access is off. Grant access in system settings to estimate Instagram foreground time.',
      freshnessText: 'Permission needed',
      badgeDotColor: '#ffd640',
      actionLabel: 'Grant Usage Access',
      actionKind: 'permission',
    };
  }

  if (summary.status === 'not_installed') {
    return {
      status: 'not_installed',
      hasVerifiedEstimate: false,
      hours: null,
      minutes: null,
      headlineText: 'No IG app',
      subtitleText:
        'Instagram (com.instagram.android) is not installed on this device, so no usage estimate is shown.',
      freshnessText: formatFreshnessLabel(summary.queriedAtMs, nowMs),
      badgeDotColor: '#f47b33',
      actionLabel: 'Refresh check',
      actionKind: 'refresh',
    };
  }

  if (summary.status === 'unavailable' || summary.todayForegroundMs === null) {
    return {
      status: 'unavailable',
      hasVerifiedEstimate: false,
      hours: null,
      minutes: null,
      headlineText: 'Unavailable',
      subtitleText:
        summary.statusReason ||
        'Android UsageStats returned no usage records for this window. Missing data is never shown as 0m.',
      freshnessText: formatFreshnessLabel(summary.queriedAtMs, nowMs),
      badgeDotColor: '#f47b33',
      actionLabel: 'Retry sync',
      actionKind: 'refresh',
    };
  }

  const usedMinutes = Math.max(0, Math.round(summary.todayForegroundMs / 60000));
  const { hours, minutes } = formatMinutesAsHoursAndMinutes(usedMinutes);

  return {
    status: 'ok',
    hasVerifiedEstimate: true,
    hours,
    minutes,
    headlineText: null,
    subtitleText: 'estimated Instagram foreground time',
    freshnessText: formatFreshnessLabel(summary.queriedAtMs, nowMs),
    badgeDotColor: '#7ae7a7',
    actionLabel: null,
    actionKind: 'refresh',
  };
}

export type LimitProgressSummary = {
  limitFormatted: string;
  remainingFormatted: string;
  progressPercent: number;
  usedMinutes: number | null;
  remainingMinutes: number | null;
  isNearLimit: boolean;
  isOverLimit: boolean;
  nudgeMessage: string | null;
};

export function calculateLimitProgress(
  todayForegroundMs: number | null,
  effectiveLimitMinutes: number,
  hasVerifiedEstimate: boolean
): LimitProgressSummary {
  const safeLimit = clampDailyLimitMinutes(effectiveLimitMinutes);
  const { compact: limitFormatted } = formatMinutesAsHoursAndMinutes(safeLimit);

  if (!hasVerifiedEstimate || todayForegroundMs === null) {
    return {
      limitFormatted,
      remainingFormatted: 'Enable access to compare',
      progressPercent: 0,
      usedMinutes: null,
      remainingMinutes: null,
      isNearLimit: false,
      isOverLimit: false,
      nudgeMessage: null,
    };
  }

  const usedMinutes = Math.max(0, Math.round(todayForegroundMs / 60000));
  const rawRatio = safeLimit > 0 ? (usedMinutes / safeLimit) * 100 : 0;
  const progressPercent = Math.max(0, Math.min(100, Math.round(rawRatio)));
  const diff = safeLimit - usedMinutes;
  const isOverLimit = diff <= 0;
  const isNearLimit = !isOverLimit && rawRatio >= 80;

  let remainingFormatted: string;
  if (diff > 0) {
    remainingFormatted =
      diff >= 60
        ? `${formatMinutesAsHoursAndMinutes(diff).compact} left`
        : `${diff} min left`;
  } else if (diff === 0) {
    remainingFormatted = 'At daily limit';
  } else {
    const over = Math.abs(diff);
    remainingFormatted =
      over >= 60
        ? `${formatMinutesAsHoursAndMinutes(over).compact} over target`
        : `${over} min over target`;
  }

  let nudgeMessage: string | null = null;
  if (isOverLimit) {
    nudgeMessage =
      'You passed your daily scroll target. No guilt—a 10-minute focus break is a great way to reset.';
  } else if (isNearLimit) {
    nudgeMessage = `Gentle nudge: ${diff} min left in today's scroll target.`;
  }

  return {
    limitFormatted,
    remainingFormatted,
    progressPercent,
    usedMinutes,
    remainingMinutes: Math.max(0, diff),
    isNearLimit,
    isOverLimit,
    nudgeMessage,
  };
}

export type BrainrotIndexSummary = {
  score: number | null;
  label: string;
  moodEmoji: string;
  moodValue: string;
  trendText: string;
  archetypeTitle: string;
  archetypeDesc: string;
};

export function calculateBrainrotIndex(
  todayForegroundMs: number | null,
  effectiveLimitMinutes: number,
  hasVerifiedEstimate: boolean,
  completedMissionsCount: number,
  completedFocusBreaks: number
): BrainrotIndexSummary {
  if (!hasVerifiedEstimate || todayForegroundMs === null) {
    return {
      score: null,
      label: 'Connect Usage Access to compute your live Brainrot Index from today’s estimate.',
      moodEmoji: '◡',
      moodValue: 'Offline & unbothered',
      trendText: 'Pending',
      archetypeTitle: 'Soft Launcher',
      archetypeDesc: '"Privacy first,\nscrolling second."',
    };
  }

  const usedMinutes = Math.max(0, Math.round(todayForegroundMs / 60000));
  const safeLimit = clampDailyLimitMinutes(effectiveLimitMinutes);
  const ratio = usedMinutes / safeLimit;

  // Higher score (up to 100) = healthier balance ("More soul"); lower score = heavier scroll ("More scroll")
  const rawBase = Math.round(100 - ratio * 55);
  const missionBonus = completedMissionsCount * 4 + Math.min(3, completedFocusBreaks) * 3;
  const score = Math.max(12, Math.min(99, rawBase + missionBonus));

  if (score >= 70) {
    return {
      score,
      label: 'Your brain is in the green-ish zone.',
      moodEmoji: '◡',
      moodValue: 'Chill and balanced',
      trendText: `${Math.max(0, Math.round((1 - ratio) * 100))}% buffer`,
      archetypeTitle: 'Grass Toucher',
      archetypeDesc: '"Short scrolls,\nlong attention span."',
    };
  }

  if (score >= 45) {
    return {
      score,
      label: 'Warming up—a quick focus break will keep you in the sunny zone.',
      moodEmoji: '◠',
      moodValue: 'Chill but curious',
      trendText: `${Math.round(ratio * 100)}% of limit`,
      archetypeTitle: 'Night Owl',
      archetypeDesc: '"One more Reel"\nis your bedtime story.',
    };
  }

  return {
    score,
    label: 'Heavy scroll session today. Time for a gentle offline reset.',
    moodEmoji: '≈',
    moodValue: 'Slightly cooked, ready to reset',
    trendText: 'Over target',
    archetypeTitle: 'Scroll Explorer',
    archetypeDesc: '"Testing the limits of\nthe infinite feed."',
  };
}

export function createInitialPersistedState(dateKey: string = getLocalDateKey()): PersistedAppState {
  const defaultMissionsMap: Record<string, boolean> = {};
  for (const m of initialMissions) {
    defaultMissionsMap[m.id] = m.done;
  }

  const initialBadges = getBadges(initialMissions, 0, {});
  const unlockedBadges: Record<string, string> = {};
  for (const b of initialBadges) {
    if (b.unlocked) {
      unlockedBadges[b.id] = dateKey;
    }
  }

  return {
    schemaVersion: 1,
    consentStatus: 'pending',
    consentUpdatedAt: null,
    trackingEnabled: true,
    dailyLimitMinutes: DEFAULT_DAILY_LIMIT_MINUTES,
    settings: {
      dailyGentleNudge: true,
      privateMode: true,
      weekendBreathingRoom: false,
    },
    baseXp: DEFAULT_BASE_XP,
    claimedXpEvents: {},
    missionsByDate: {
      [dateKey]: defaultMissionsMap,
    },
    dailyChestByDate: {},
    unlockedBadges,
    completedFocusBreaks: 0,
    lastFocusBreakAt: null,
    cachedUsageSummary: null,
  };
}

export function getMissionsForDate(
  state: PersistedAppState,
  dateKey: string = getLocalDateKey()
): Mission[] {
  const savedForDate = state.missionsByDate[dateKey];
  return initialMissions.map((m) => ({
    ...m,
    done: savedForDate ? Boolean(savedForDate[m.id]) : m.done,
  }));
}

export function getDailyChestForDate(
  state: PersistedAppState,
  date: Date = new Date()
): DailyChest {
  const dateKey = getLocalDateKey(date);
  const existing = state.dailyChestByDate[dateKey];
  if (existing) {
    return existing;
  }
  return {
    claimed: false,
    item: dailyItems[date.getDate() % dailyItems.length],
  };
}

export function calculateTotalXp(state: PersistedAppState): number {
  const eventSum = Object.values(state.claimedXpEvents).reduce((acc, val) => acc + val, 0);
  return state.baseXp + eventSum;
}

export function calculateEarnedXpForDate(
  state: PersistedAppState,
  dateKey: string = getLocalDateKey()
): number {
  let todayXp = 0;
  for (const [key, val] of Object.entries(state.claimedXpEvents)) {
    if (key.includes(`:${dateKey}:`)) {
      todayXp += val;
    }
  }
  return todayXp;
}

export type StateTransitionResult = {
  nextState: PersistedAppState;
  xpAwarded: number;
  newlyUnlockedBadge: Badge | null;
  celebration: Celebration | null;
  toastMessage: string;
};

function syncUnlockedBadges(
  prevState: PersistedAppState,
  missions: Mission[],
  completedFocusBreaks: number,
  dateKey: string
): {
  unlockedBadges: Record<string, string>;
  newlyUnlockedBadge: Badge | null;
} {
  const prevBadges = getBadges(
    getMissionsForDate(prevState, dateKey),
    prevState.completedFocusBreaks,
    prevState.unlockedBadges
  );
  const nextUnlockedMap = { ...prevState.unlockedBadges };
  const candidateBadges = getBadges(missions, completedFocusBreaks, nextUnlockedMap);

  let newlyUnlockedBadge: Badge | null = null;
  for (let i = 0; i < candidateBadges.length; i++) {
    const badge = candidateBadges[i];
    const wasUnlocked = prevBadges[i]?.unlocked ?? false;
    if (badge.unlocked && ! nextUnlockedMap[badge.id]) {
      nextUnlockedMap[badge.id] = dateKey;
    }
    if (badge.unlocked && !wasUnlocked && !newlyUnlockedBadge) {
      newlyUnlockedBadge = { ...badge, unlockedAt: dateKey };
    }
  }

  return { unlockedBadges: nextUnlockedMap, newlyUnlockedBadge };
}

/**
 * Toggles or completes a mission for `dateKey` while guaranteeing XP idempotency:
 * Completing the same mission multiple times on the same dateKey never awards duplicate XP (FR-008, AT-06).
 */
export function toggleMissionState(
  state: PersistedAppState,
  missionIndex: number,
  dateKey: string = getLocalDateKey(),
  forceComplete = false
): StateTransitionResult {
  const currentMissions = getMissionsForDate(state, dateKey);
  const target = currentMissions[missionIndex];
  if (!target) {
    return {
      nextState: state,
      xpAwarded: 0,
      newlyUnlockedBadge: null,
      celebration: null,
      toastMessage: '',
    };
  }

  const nextDone = forceComplete ? true : !target.done;
  if (forceComplete && target.done) {
    // Already completed today: strictly idempotent no-op
    return {
      nextState: state,
      xpAwarded: 0,
      newlyUnlockedBadge: null,
      celebration: null,
      toastMessage: `${target.title} is already completed today.`,
    };
  }

  const nextMissions = currentMissions.map((m, idx) =>
    idx === missionIndex ? { ...m, done: nextDone } : m
  );
  const nextDateMap: Record<string, boolean> = {};
  for (const m of nextMissions) {
    nextDateMap[m.id] = m.done;
  }

  const eventKey = `mission:${dateKey}:${target.id}`;
  const alreadyClaimedXp = state.claimedXpEvents[eventKey] ?? 0;
  const nextClaimedEvents = { ...state.claimedXpEvents };
  let xpAwarded = 0;

  if (nextDone && alreadyClaimedXp === 0) {
    nextClaimedEvents[eventKey] = target.reward;
    xpAwarded = target.reward;
  }

  const { unlockedBadges, newlyUnlockedBadge } = syncUnlockedBadges(
    state,
    nextMissions,
    state.completedFocusBreaks,
    dateKey
  );

  const nextState: PersistedAppState = {
    ...state,
    claimedXpEvents: nextClaimedEvents,
    missionsByDate: {
      ...state.missionsByDate,
      [dateKey]: nextDateMap,
    },
    unlockedBadges,
  };

  if (!nextDone) {
    return {
      nextState,
      xpAwarded: 0,
      newlyUnlockedBadge: null,
      celebration: null,
      toastMessage: 'Mission reopened. No shame, just another chance.',
    };
  }

  const celebration: Celebration = newlyUnlockedBadge
    ? {
        title: newlyUnlockedBadge.name,
        detail: newlyUnlockedBadge.description,
        reward: 'SPECIAL BADGE UNLOCKED',
        iconName: newlyUnlockedBadge.iconName,
        kind: 'badge',
      }
    : {
        title: 'Mission complete',
        detail: target.title,
        reward: xpAwarded > 0 ? `+${xpAwarded} XP` : 'COMPLETED TODAY',
        iconName: 'check',
        kind: 'mission',
      };

  const toastMessage = newlyUnlockedBadge
    ? `${newlyUnlockedBadge.name} unlocked.`
    : xpAwarded > 0
    ? `+${xpAwarded} XP added to your healthy brain bank.`
    : `${target.title} marked complete (XP already claimed today).`;

  return {
    nextState,
    xpAwarded,
    newlyUnlockedBadge,
    celebration,
    toastMessage,
  };
}

export function claimDailyChestState(
  state: PersistedAppState,
  date: Date = new Date()
): StateTransitionResult {
  const dateKey = getLocalDateKey(date);
  const currentChest = getDailyChestForDate(state, date);
  const eventKey = `chest:${dateKey}`;

  if (currentChest.claimed || state.claimedXpEvents[eventKey]) {
    return {
      nextState: state,
      xpAwarded: 0,
      newlyUnlockedBadge: null,
      celebration: null,
      toastMessage: 'Daily chest already claimed today.',
    };
  }

  const updatedChest: DailyChest = {
    ...currentChest,
    claimed: true,
  };

  const nextState: PersistedAppState = {
    ...state,
    claimedXpEvents: {
      ...state.claimedXpEvents,
      [eventKey]: DAILY_CHEST_XP_REWARD,
    },
    dailyChestByDate: {
      ...state.dailyChestByDate,
      [dateKey]: updatedChest,
    },
  };

  return {
    nextState,
    xpAwarded: DAILY_CHEST_XP_REWARD,
    newlyUnlockedBadge: null,
    celebration: {
      title: 'Daily chest opened',
      detail: updatedChest.item,
      reward: `+${DAILY_CHEST_XP_REWARD} XP · ITEM FOUND`,
      iconName: 'gift',
      kind: 'chest',
    },
    toastMessage: `+${DAILY_CHEST_XP_REWARD} XP from your daily chest.`,
  };
}

/**
 * Records a completed focus break session (FR-021):
 * - Increments completedFocusBreaks
 * - Awards +30 XP (idempotent per sessionId)
 * - Automatically marks "Touch some grass" mission complete if not already done today
 * - Unlocks Offline Icon badge
 */
export function completeFocusBreakState(
  state: PersistedAppState,
  sessionId: string,
  dateKey: string = getLocalDateKey()
): StateTransitionResult {
  const breakEventKey = `break:${dateKey}:${sessionId}`;
  if (state.claimedXpEvents[breakEventKey]) {
    return {
      nextState: state,
      xpAwarded: 0,
      newlyUnlockedBadge: null,
      celebration: null,
      toastMessage: 'Focus break already recorded.',
    };
  }

  const nextFocusBreaks = state.completedFocusBreaks + 1;
  const currentMissions = getMissionsForDate(state, dateKey);
  const grassIdx = currentMissions.findIndex((m) => m.id === 'touch-grass');

  let workingState: PersistedAppState = {
    ...state,
    completedFocusBreaks: nextFocusBreaks,
    lastFocusBreakAt: dateKey,
    claimedXpEvents: {
      ...state.claimedXpEvents,
      [breakEventKey]: FOCUS_BREAK_XP_REWARD,
    },
  };

  let totalXpAwarded = FOCUS_BREAK_XP_REWARD;
  if (grassIdx >= 0 && !currentMissions[grassIdx].done) {
    const missionRes = toggleMissionState(workingState, grassIdx, dateKey, true);
    workingState = missionRes.nextState;
    totalXpAwarded += missionRes.xpAwarded;
  }

  const updatedMissions = getMissionsForDate(workingState, dateKey);
  const { unlockedBadges, newlyUnlockedBadge } = syncUnlockedBadges(
    state,
    updatedMissions,
    nextFocusBreaks,
    dateKey
  );

  const finalState: PersistedAppState = {
    ...workingState,
    unlockedBadges,
  };

  const celebration: Celebration = newlyUnlockedBadge
    ? {
        title: newlyUnlockedBadge.name,
        detail: newlyUnlockedBadge.description,
        reward: `+${totalXpAwarded} XP · BADGE UNLOCKED`,
        iconName: newlyUnlockedBadge.iconName,
        kind: 'badge',
      }
    : {
        title: 'Focus break complete',
        detail: 'Your brain thanks you for stepping away from the feed.',
        reward: `+${totalXpAwarded} XP`,
        iconName: 'clock',
        kind: 'mission',
      };

  return {
    nextState: finalState,
    xpAwarded: totalXpAwarded,
    newlyUnlockedBadge,
    celebration,
    toastMessage: `Focus break complete! +${totalXpAwarded} XP earned.`,
  };
}

/**
 * Deletes local usage cache and activity history (FR-014, UC-04, AT-08) while preserving
 * the user's current consent/privacy settings.
 */
export function clearLocalHistoryState(
  state: PersistedAppState,
  dateKey: string = getLocalDateKey()
): PersistedAppState {
  const clean = createInitialPersistedState(dateKey);
  return {
    ...clean,
    consentStatus: state.consentStatus,
    consentUpdatedAt: state.consentUpdatedAt,
    trackingEnabled: state.trackingEnabled,
    dailyLimitMinutes: state.dailyLimitMinutes,
    settings: { ...state.settings },
    baseXp: DEFAULT_BASE_XP,
    claimedXpEvents: {},
    missionsByDate: {
      [dateKey]: {
        'touch-grass': false,
        'set-scroll-limit': false,
        'brain-check-in': false,
      },
    },
    dailyChestByDate: {},
    unlockedBadges: {},
    completedFocusBreaks: 0,
    lastFocusBreakAt: null,
    cachedUsageSummary: null,
  };
}
