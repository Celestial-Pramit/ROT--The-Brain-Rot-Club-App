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
  UsageQueryResult,
  UserProfile,
} from '../constants/types';

export const DEFAULT_BASE_XP = 284;
export const DEFAULT_DAILY_LIMIT_MINUTES = 120;
export const FOCUS_BREAK_XP_REWARD = 30;
export const DAILY_CHEST_XP_REWARD = 50;
export const MAX_DISPLAY_NAME_LENGTH = 28;
export const DEFAULT_FALLBACK_DISPLAY_NAME = 'ROT User';
export const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

export function sanitizeDisplayName(
  input: string | null | undefined,
  maxLength: number = MAX_DISPLAY_NAME_LENGTH
): string | null {
  if (typeof input !== 'string') return null;
  const collapsed = input.replace(/\s+/g, ' ').trim();
  if (collapsed.length === 0) return null;
  return collapsed.slice(0, maxLength).trim();
}

export function resolveEffectiveDisplayName(profile?: UserProfile | null): {
  displayName: string;
  source: 'custom' | 'device' | 'fallback';
  initials: string;
  handle: string;
} {
  const custom = sanitizeDisplayName(profile?.customDisplayName);
  if (custom) {
    return {
      displayName: custom,
      source: 'custom',
      initials: custom.charAt(0).toUpperCase(),
      handle: `${custom.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '') || 'rot'}.resets`,
    };
  }

  const device = sanitizeDisplayName(profile?.deviceDefaultName);
  if (device && device.toLowerCase() !== 'unknown') {
    return {
      displayName: device,
      source: 'device',
      initials: device.charAt(0).toUpperCase(),
      handle: `${device.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '') || 'device'}.resets`,
    };
  }

  return {
    displayName: DEFAULT_FALLBACK_DISPLAY_NAME,
    source: 'fallback',
    initials: 'R',
    handle: 'rot.user',
  };
}

export function updateCustomDisplayNameState(
  state: PersistedAppState,
  rawName: string | null | undefined
): {
  nextState: PersistedAppState;
  resolvedName: string;
  revertedToDefault: boolean;
} {
  const sanitized = sanitizeDisplayName(rawName);
  const nextProfile: UserProfile = {
    ...state.profile,
    customDisplayName: sanitized,
  };
  const nextState: PersistedAppState = {
    ...state,
    profile: nextProfile,
  };
  const resolved = resolveEffectiveDisplayName(nextProfile);
  return {
    nextState,
    resolvedName: resolved.displayName,
    revertedToDefault: sanitized === null,
  };
}

export function updateDeviceDefaultNameState(
  state: PersistedAppState,
  rawDeviceName: string | null | undefined
): PersistedAppState {
  const sanitized = sanitizeDisplayName(rawDeviceName);
  if (!sanitized || sanitized.toLowerCase() === 'unknown') {
    return state;
  }
  if (state.profile.deviceDefaultName === sanitized) {
    return state;
  }
  return {
    ...state,
    profile: {
      ...state.profile,
      deviceDefaultName: sanitized,
    },
  };
}

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

export function formatFreshnessLabel(
  queriedAtMs: number | null | undefined,
  nowMs: number = Date.now()
): string {
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

export function isSuccessfulUsageSummary(
  summary: InstagramUsageSummary | null | undefined
): boolean {
  if (!summary || !summary.permissionGranted) return false;
  return (
    (summary.status === 'ok' ||
      summary.status === 'zero_usage' ||
      summary.status === 'incomplete') &&
    typeof summary.todayForegroundMs === 'number' &&
    summary.todayForegroundMs >= 0
  );
}

/**
 * Keeps the last successful estimate separate from the latest query result.
 * A failed, denied, or paused query never overwrites valid historical cached data with zero or erases it.
 */
export function selectCachedSummaryToPersist(
  previousCached: InstagramUsageSummary | null,
  latestSummary: InstagramUsageSummary,
  consentStatus: ConsentStatus,
  trackingEnabled: boolean
): InstagramUsageSummary | null {
  if (consentStatus !== 'accepted' || !trackingEnabled) {
    return previousCached;
  }
  if (isSuccessfulUsageSummary(latestSummary)) {
    return latestSummary;
  }
  return previousCached;
}

export type UsageDisplayState = {
  queryResult: UsageQueryResult;
  status: UsageDataStatus;
  hasVerifiedEstimate: boolean;
  isShowingCachedFallback: boolean;
  staleOrIncompleteWarning: string | null;
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
 * Maps raw UsageStats + cached estimate + user consent/settings into a typed structured UsageDisplayState.
 * Strictly obeys SRS & Part C rules:
 * - Never presents missing, denied, paused, or failed usage data as 0h 00m (BT-04, AT-03).
 * - Distinguishes permission_required, tracking_paused, not_installed, no_os_record, query_failed, stale, incomplete, zero_usage, and ok.
 * - Explicitly labels verified usage as estimated Instagram foreground time, never exact Reel counts (BT-02, BT-03, AT-11).
 */
export function buildUsageDisplayState(
  summary: InstagramUsageSummary | null,
  consentStatus: ConsentStatus,
  trackingEnabled: boolean,
  nowMs: number = Date.now(),
  cachedSummary: InstagramUsageSummary | null = null
): UsageDisplayState {
  const validCached =
    cachedSummary &&
    typeof cachedSummary.todayForegroundMs === 'number' &&
    cachedSummary.todayForegroundMs >= 0 &&
    getLocalDateKey(new Date(cachedSummary.queriedAtMs)) === getLocalDateKey(new Date(nowMs))
      ? cachedSummary
      : null;

  // 1. Consent not yet accepted
  if (consentStatus !== 'accepted') {
    const queryResult: UsageQueryResult = {
      status: 'permission_required',
      estimatedMinutes: null,
      lastUpdatedAt: validCached?.queriedAtMs ?? null,
      source: 'none',
      isComplete: false,
      errorCode: 'CONSENT_REQUIRED',
    };
    return {
      queryResult,
      status: 'permission_required',
      hasVerifiedEstimate: false,
      isShowingCachedFallback: false,
      staleOrIncompleteWarning: null,
      hours: null,
      minutes: null,
      headlineText: 'Access needed',
      subtitleText: 'ROT needs Usage Access to estimate your Instagram screen time.',
      freshnessText: 'Permission required',
      badgeDotColor: '#ffd640',
      actionLabel: 'Grant permission',
      actionKind: 'consent',
    };
  }

  // 2. Tracking paused by user
  if (!trackingEnabled) {
    const queryResult: UsageQueryResult = {
      status: 'tracking_paused',
      estimatedMinutes: null,
      lastUpdatedAt: validCached?.queriedAtMs ?? null,
      source: validCached?.aggregationSource ?? 'paused',
      isComplete: false,
    };
    return {
      queryResult,
      status: 'tracking_paused',
      hasVerifiedEstimate: false,
      isShowingCachedFallback: false,
      staleOrIncompleteWarning: validCached
        ? `Previous saved estimate (${
            formatMinutesAsHoursAndMinutes(Math.round((validCached.todayForegroundMs ?? 0) / 60000)).compact
          } at ${formatFreshnessLabel(validCached.queriedAtMs, nowMs).toLowerCase()}) is preserved.`
        : null,
      hours: null,
      minutes: null,
      headlineText: 'Tracking paused',
      subtitleText: 'Tracking is paused. Your previous saved progress is preserved.',
      freshnessText: 'Paused by you',
      badgeDotColor: '#ffd640',
      actionLabel: 'Resume tracking',
      actionKind: 'enable_tracking',
    };
  }

  // 3. Permission missing or revoked while running
  if (!summary || summary.status === 'permission_required' || !summary.permissionGranted) {
    const queryResult: UsageQueryResult = {
      status: 'permission_required',
      estimatedMinutes: null,
      lastUpdatedAt: validCached?.queriedAtMs ?? null,
      source: 'permission_check',
      isComplete: false,
      errorCode: summary?.errorCode ?? 'PERMISSION_DENIED',
    };
    return {
      queryResult,
      status: 'permission_required',
      hasVerifiedEstimate: false,
      isShowingCachedFallback: false,
      staleOrIncompleteWarning: validCached
        ? `Usage Access was revoked. Last saved estimate (${
            formatMinutesAsHoursAndMinutes(Math.round((validCached.todayForegroundMs ?? 0) / 60000)).compact
          }, ${formatFreshnessLabel(validCached.queriedAtMs, nowMs).toLowerCase()}) is preserved.`
        : null,
      hours: null,
      minutes: null,
      headlineText: 'Access needed',
      subtitleText: 'ROT needs Usage Access to estimate your Instagram screen time.',
      freshnessText: 'Permission needed',
      badgeDotColor: '#ffd640',
      actionLabel: 'Grant permission',
      actionKind: 'permission',
    };
  }

  // 4. Instagram not installed
  if (summary.status === 'not_installed' || (!summary.instagramInstalled && !summary.todayForegroundMs)) {
    const queryResult: UsageQueryResult = {
      status: 'not_installed',
      estimatedMinutes: null,
      lastUpdatedAt: summary.queriedAtMs,
      source: summary.aggregationSource ?? 'package_manager',
      isComplete: false,
    };
    return {
      queryResult,
      status: 'not_installed',
      hasVerifiedEstimate: false,
      isShowingCachedFallback: false,
      staleOrIncompleteWarning: null,
      hours: null,
      minutes: null,
      headlineText: 'Not installed',
      subtitleText: "Instagram isn't installed on this device.",
      freshnessText: formatFreshnessLabel(summary.queriedAtMs, nowMs),
      badgeDotColor: '#f47b33',
      actionLabel: null,
      actionKind: null,
    };
  }

  // 5. Query failed or timed out
  if (summary.status === 'query_failed') {
    const cachedMins =
      validCached && validCached.todayForegroundMs !== null
        ? Math.max(0, Math.round(validCached.todayForegroundMs / 60000))
        : null;
    const cachedFormatted =
      cachedMins !== null ? formatMinutesAsHoursAndMinutes(cachedMins) : null;

    const queryResult: UsageQueryResult = {
      status: 'query_failed',
      estimatedMinutes: cachedMins,
      lastUpdatedAt: validCached?.queriedAtMs ?? null,
      source: validCached?.aggregationSource ?? 'error',
      isComplete: false,
      errorCode: summary.errorCode ?? 'USAGE_QUERY_ERROR',
    };
    return {
      queryResult,
      status: 'query_failed',
      hasVerifiedEstimate: false,
      isShowingCachedFallback: cachedFormatted !== null,
      staleOrIncompleteWarning:
        cachedFormatted && validCached
          ? `Showing last saved estimate (${cachedFormatted.compact}, ${formatFreshnessLabel(
              validCached.queriedAtMs,
              nowMs
            ).toLowerCase()}) — not current verified data.`
          : null,
      hours: cachedFormatted ? cachedFormatted.hours : null,
      minutes: cachedFormatted ? cachedFormatted.minutes : null,
      headlineText: 'Sync failed',
      subtitleText:
        "We couldn't retrieve your usage data. Your previous saved data hasn't been deleted.",
      freshnessText: validCached
        ? `Saved · ${formatFreshnessLabel(validCached.queriedAtMs, nowMs)}`
        : 'Query failed',
      badgeDotColor: '#f47b33',
      actionLabel: 'Try again',
      actionKind: 'refresh',
    };
  }

  // 6. No OS usage record
  if (
    summary.status === 'no_os_record' ||
    summary.status === 'unavailable' ||
    summary.todayForegroundMs === null
  ) {
    const queryResult: UsageQueryResult = {
      status: 'no_os_record',
      estimatedMinutes: null,
      lastUpdatedAt: summary.queriedAtMs,
      source: summary.aggregationSource ?? 'no_os_records',
      isComplete: false,
    };
    return {
      queryResult,
      status: 'no_os_record',
      hasVerifiedEstimate: false,
      isShowingCachedFallback: false,
      staleOrIncompleteWarning: null,
      hours: null,
      minutes: null,
      headlineText: 'No OS record',
      subtitleText: 'No usage record is available yet. Open Instagram and check again.',
      freshnessText: formatFreshnessLabel(summary.queriedAtMs, nowMs),
      badgeDotColor: '#f47b33',
      actionLabel: 'Refresh',
      actionKind: 'refresh',
    };
  }

  // 7. Valid numeric reading from OS (0 or >0, fresh, stale, or incomplete)
  const usedMinutes = Math.max(0, Math.round(summary.todayForegroundMs / 60000));
  const { hours, minutes } = formatMinutesAsHoursAndMinutes(usedMinutes);
  const ageMs = Math.max(0, nowMs - summary.queriedAtMs);
  const isStale = summary.status === 'stale' || ageMs > STALE_THRESHOLD_MS;
  const isIncomplete =
    summary.status === 'incomplete' || summary.isComplete === false;
  const isZero = summary.status === 'zero_usage' || usedMinutes === 0;

  let resolvedStatus: UsageDataStatus = 'ok';
  if (isStale) {
    resolvedStatus = 'stale';
  } else if (isIncomplete) {
    resolvedStatus = 'incomplete';
  } else if (isZero) {
    resolvedStatus = 'zero_usage';
  }

  const queryResult: UsageQueryResult = {
    status: resolvedStatus,
    estimatedMinutes: usedMinutes,
    lastUpdatedAt: summary.queriedAtMs,
    source: summary.aggregationSource ?? 'usage_events',
    isComplete: isIncomplete ? false : summary.isComplete ?? true,
  };

  if (isStale || isIncomplete) {
    const warningReason = isStale
      ? `Stale estimate (${formatFreshnessLabel(
          summary.queriedAtMs,
          nowMs
        ).toLowerCase()}). Refresh to verify current usage.`
      : 'Incomplete OS interval log — estimated from daily aggregate bucket.';
    return {
      queryResult,
      status: resolvedStatus,
      hasVerifiedEstimate: false,
      isShowingCachedFallback: true,
      staleOrIncompleteWarning: warningReason,
      hours,
      minutes,
      headlineText: null,
      subtitleText: 'estimated Instagram foreground time (unverified / needs refresh)',
      freshnessText: `${isStale ? 'Stale' : 'Incomplete'} · ${formatFreshnessLabel(
        summary.queriedAtMs,
        nowMs
      )}`,
      badgeDotColor: '#ffd640',
      actionLabel: 'Refresh',
      actionKind: 'refresh',
    };
  }

  return {
    queryResult,
    status: resolvedStatus,
    hasVerifiedEstimate: true,
    isShowingCachedFallback: false,
    staleOrIncompleteWarning: null,
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

export function createInitialPersistedState(
  dateKey: string = getLocalDateKey(),
  deviceDefaultName: string | null = null
): PersistedAppState {
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
    schemaVersion: 2,
    consentStatus: 'pending',
    consentUpdatedAt: null,
    trackingEnabled: true,
    dailyLimitMinutes: DEFAULT_DAILY_LIMIT_MINUTES,
    profile: {
      customDisplayName: null,
      deviceDefaultName: sanitizeDisplayName(deviceDefaultName),
    },
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
    if (badge.unlocked && !nextUnlockedMap[badge.id]) {
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
 * - Unlocks Offline Icon badge (FR-009)
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
 * the user's current consent/privacy settings and display name profile.
 */
export function clearLocalHistoryState(
  state: PersistedAppState,
  dateKey: string = getLocalDateKey()
): PersistedAppState {
  const clean = createInitialPersistedState(dateKey, state.profile.deviceDefaultName);
  return {
    ...clean,
    consentStatus: state.consentStatus,
    consentUpdatedAt: state.consentUpdatedAt,
    trackingEnabled: state.trackingEnabled,
    dailyLimitMinutes: state.dailyLimitMinutes,
    profile: { ...state.profile },
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
