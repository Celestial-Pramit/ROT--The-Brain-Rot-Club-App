import {
  dailyItems,
  getBadges,
  INITIAL_WEEKLY_QUESTS,
  initialMissions,
  MOOD_OPTIONS,
} from '../constants/data';
import {
  Badge,
  BrainrotBreakdown,
  CardExportFormat,
  CardType,
  Celebration,
  ConsentStatus,
  DailyChest,
  InstagramUsageSummary,
  Mission,
  MoodId,
  MoodLogEntry,
  PendingLocalNotification,
  PersistedAppState,
  PlayerLevelInfo,
  StreakState,
  UsageDataStatus,
  UsageQueryResult,
  UserDataExportPayload,
  UserProfile,
  UserSettings,
  WeeklyAchievementSummary,
  WeeklyQuest,
  WeeklyQuestId,
  WeeklyQuestState,
  XpLedgerCategory,
  XpLedgerEntry,
} from '../constants/types';

export const DEFAULT_BASE_XP = 284;
export const DEFAULT_DAILY_LIMIT_MINUTES = 120;
export const MIN_DAILY_LIMIT_MINUTES = 15;
export const MAX_DAILY_LIMIT_MINUTES = 720;
export const DAILY_LIMIT_STEP_MINUTES = 5;
export const FOCUS_BREAK_XP_REWARD = 30;
export const DAILY_CHEST_XP_REWARD = 50;
export const STREAK_RECOVERY_XP_REWARD = 25;
export const MAX_DISPLAY_NAME_LENGTH = 28;
export const MAX_MOOD_NOTE_LENGTH = 120;
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
      handle: `${
        custom
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '.')
          .replace(/^\.+|\.+$/g, '') || 'rot'
      }.resets`,
    };
  }

  const device = sanitizeDisplayName(profile?.deviceDefaultName);
  if (device && device.toLowerCase() !== 'unknown') {
    return {
      displayName: device,
      source: 'device',
      initials: device.charAt(0).toUpperCase(),
      handle: `${
        device
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '.')
          .replace(/^\.+|\.+$/g, '') || 'device'
      }.resets`,
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

/**
 * Parses a local YYYY-MM-DD key at local noon (12:00) so DST shifts never cross midnight boundaries.
 */
export function parseLocalDateKey(dateKey: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim());
  if (!match) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
  }
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  return new Date(year, month, day, 12, 0, 0, 0);
}

export function addLocalDays(dateKey: string, deltaDays: number): string {
  const d = parseLocalDateKey(dateKey);
  d.setDate(d.getDate() + deltaDays);
  return getLocalDateKey(d);
}

export function diffLocalDays(fromDateKey: string, toDateKey: string): number {
  const from = parseLocalDateKey(fromDateKey);
  const to = parseLocalDateKey(toDateKey);
  return Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * Returns a Monday-anchored week key (`week-YYYY-MM-DD` of that week's Monday in local time).
 */
export function getLocalWeekKey(dateOrKey: Date | string = new Date()): string {
  const d =
    typeof dateOrKey === 'string'
      ? parseLocalDateKey(dateOrKey)
      : new Date(
          dateOrKey.getFullYear(),
          dateOrKey.getMonth(),
          dateOrKey.getDate(),
          12,
          0,
          0,
          0
        );
  const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon, ...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  d.setDate(d.getDate() + diffToMonday);
  return `week-${getLocalDateKey(d)}`;
}

export function getDatesInWeek(weekKey: string): string[] {
  const mondayDateKey = weekKey.startsWith('week-')
    ? weekKey.slice('week-'.length)
    : getLocalDateKey();
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(addLocalDays(mondayDateKey, i));
  }
  return dates;
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
  return Math.max(
    MIN_DAILY_LIMIT_MINUTES,
    Math.min(MAX_DAILY_LIMIT_MINUTES, Math.round(minutes))
  );
}

export function stepDailyLimitMinutes(
  currentMinutes: number,
  deltaMinutes: number = DAILY_LIMIT_STEP_MINUTES
): number {
  return clampDailyLimitMinutes(currentMinutes + deltaMinutes);
}

export function parseCustomDailyLimitInput(rawInput: string): {
  valid: boolean;
  minutes: number | null;
  error: string | null;
} {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      valid: false,
      minutes: null,
      error: `Enter a value between ${MIN_DAILY_LIMIT_MINUTES} and ${MAX_DAILY_LIMIT_MINUTES} minutes.`,
    };
  }
  if (!/^\d+$/.test(trimmed)) {
    return {
      valid: false,
      minutes: null,
      error: 'Please enter whole minutes only (for example, 45 or 105).',
    };
  }
  const parsed = Number(trimmed);
  if (parsed < MIN_DAILY_LIMIT_MINUTES || parsed > MAX_DAILY_LIMIT_MINUTES) {
    return {
      valid: false,
      minutes: null,
      error: `Target must be between ${MIN_DAILY_LIMIT_MINUTES}m and ${MAX_DAILY_LIMIT_MINUTES}m (12h).`,
    };
  }
  return {
    valid: true,
    minutes: clampDailyLimitMinutes(parsed),
    error: null,
  };
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
  breakdown: BrainrotBreakdown;
};

export function calculateBrainrotIndex(
  todayForegroundMs: number | null,
  effectiveLimitMinutes: number,
  hasVerifiedEstimate: boolean,
  completedMissionsCount: number,
  completedFocusBreaks: number,
  loggedMood: MoodLogEntry | null = null
): BrainrotIndexSummary {
  const mBonus = completedMissionsCount * 4;
  const bBonus = Math.min(3, completedFocusBreaks) * 3;

  if (!hasVerifiedEstimate || todayForegroundMs === null) {
    return {
      score: null,
      label: 'Connect Usage Access to compute your live Brainrot Index from today’s estimate.',
      moodEmoji: loggedMood ? loggedMood.emoji : '◡',
      moodValue: loggedMood ? loggedMood.label : 'Offline & unbothered',
      trendText: 'Pending',
      archetypeTitle: 'Soft Launcher',
      archetypeDesc: '"Privacy first,\nscrolling second."',
      breakdown: {
        baseScore: 100,
        usageRatioPercent: null,
        missionBonus: mBonus,
        focusBreakBonus: bBonus,
        finalScore: null,
        summaryText: `Usage Access needed for live score · +${mBonus} mission bonus · +${bBonus} focus bonus queued.`,
      },
    };
  }

  const usedMinutes = Math.max(0, Math.round(todayForegroundMs / 60000));
  const safeLimit = clampDailyLimitMinutes(effectiveLimitMinutes);
  const ratio = usedMinutes / safeLimit;
  const usageRatioPercent = Math.round(ratio * 100);

  // Higher score (up to 100) = healthier balance ("More soul"); lower score = heavier scroll ("More scroll")
  const rawBase = Math.round(100 - ratio * 55);
  const missionBonus = mBonus + bBonus;
  const uncappedTotal = rawBase + missionBonus;
  const score = Math.max(12, Math.min(99, uncappedTotal));

  const breakdown: BrainrotBreakdown = {
    baseScore: Math.max(0, Math.min(100, rawBase)),
    usageRatioPercent,
    missionBonus: mBonus,
    focusBreakBonus: bBonus,
    finalScore: score,
    summaryText: `${usageRatioPercent}% of ${formatMinutesAsHoursAndMinutes(safeLimit).compact} target (base ${Math.max(
      0,
      rawBase
    )}) + ${mBonus} mission pts + ${bBonus} break pts = ${score}/100${
      uncappedTotal > 99 ? ' (capped at 99)' : ''
    }`,
  };

  if (score >= 70) {
    return {
      score,
      label: 'Your brain is in the green-ish zone.',
      moodEmoji: loggedMood ? loggedMood.emoji : '◡',
      moodValue: loggedMood ? loggedMood.label : 'Chill and balanced',
      trendText: `${Math.max(0, Math.round((1 - ratio) * 100))}% buffer`,
      archetypeTitle: 'Grass Toucher',
      archetypeDesc: '"Short scrolls,\nlong attention span."',
      breakdown,
    };
  }

  if (score >= 45) {
    return {
      score,
      label: 'Warming up—a quick focus break will keep you in the sunny zone.',
      moodEmoji: loggedMood ? loggedMood.emoji : '◠',
      moodValue: loggedMood ? loggedMood.label : 'Chill but curious',
      trendText: `${usageRatioPercent}% of limit`,
      archetypeTitle: 'Night Owl',
      archetypeDesc: '"One more Reel"\nis your bedtime story.',
      breakdown,
    };
  }

  return {
    score,
    label: 'Heavy scroll session today. Time for a gentle offline reset.',
    moodEmoji: loggedMood ? loggedMood.emoji : '≈',
    moodValue: loggedMood ? loggedMood.label : 'Slightly cooked, ready to reset',
    trendText: 'Over target',
    archetypeTitle: 'Scroll Explorer',
    archetypeDesc: '"Testing the limits of\nthe infinite feed."',
    breakdown,
  };
}

export function createInitialStreakState(
  dateKey: string = getLocalDateKey()
): StreakState {
  return {
    currentStreak: 1,
    longestStreak: 1,
    lastEvaluatedDate: dateKey,
    graceDaysRemaining: 1,
    maxGraceDaysPerWeek: 1,
    graceWeekKey: getLocalWeekKey(dateKey),
    historyByDate: {
      [dateKey]: 'completed',
    },
    recoveryNeeded: false,
    previousStreakBeforeBreak: 0,
    recoveredThisWeek: false,
  };
}

export function createInitialWeeklyQuestState(
  weekKey: string = getLocalWeekKey()
): WeeklyQuestState {
  return {
    weekKey,
    quests: INITIAL_WEEKLY_QUESTS.map((q) => ({
      ...q,
      progress: 0,
      completed: false,
      claimed: false,
    })),
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

  const weekKey = getLocalWeekKey(dateKey);

  return {
    schemaVersion: 3,
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
      missionReminders: true,
      streakReminders: true,
      achievementNotifications: true,
      eveningReminderHour: 19,
      eveningReminderMinute: 0,
      streakReminderHour: 21,
      streakReminderMinute: 0,
      quietHoursEnabled: true,
      quietStartHour: 22,
      quietEndHour: 8,
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
    streak: createInitialStreakState(dateKey),
    weeklyQuestsByWeek: {
      [weekKey]: createInitialWeeklyQuestState(weekKey),
    },
    moodLogsByDate: {},
    xpLedger: [],
    sentNotificationsByDate: {},
    selectedCardType: 'archetype',
    selectedCardFormat: 'feed',
  };
}

export function getMissionsForDate(
  state: PersistedAppState,
  dateKey: string = getLocalDateKey(),
  usageDisplay?: UsageDisplayState | null,
  effectiveLimitMinutes?: number
): Mission[] {
  const savedForDate = state.missionsByDate[dateKey];
  const limitMins = clampDailyLimitMinutes(
    effectiveLimitMinutes ?? state.dailyLimitMinutes
  );

  return initialMissions.map((m) => {
    const done = savedForDate ? Boolean(savedForDate[m.id]) : m.done;
    if (m.id === 'stay-under-target') {
      if (!usageDisplay) {
        return {
          ...m,
          done,
          progressLabel: done ? 'Verified within target' : 'Auto-tracked via Usage Access',
        };
      }
      if (!usageDisplay.hasVerifiedEstimate || usageDisplay.queryResult.estimatedMinutes === null) {
        return {
          ...m,
          done,
          progressLabel: 'Requires Usage Access',
          statusHint: usageDisplay.subtitleText,
        };
      }
      const usedMins = usageDisplay.queryResult.estimatedMinutes;
      const underTarget = usedMins <= limitMins;
      return {
        ...m,
        done,
        autoVerified: underTarget,
        progressLabel: `${formatMinutesAsHoursAndMinutes(usedMins).compact} / ${
          formatMinutesAsHoursAndMinutes(limitMins).compact
        } target`,
        statusHint: underTarget
          ? 'Verified within your daily scroll target'
          : 'Currently above today’s scroll target',
      };
    }

    if (m.id === 'brain-check-in' && state.moodLogsByDate?.[dateKey]) {
      const mood = state.moodLogsByDate[dateKey];
      return {
        ...m,
        done,
        progressLabel: `Logged: ${mood.label}`,
      };
    }

    return {
      ...m,
      done,
    };
  });
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
    if (key.includes(`:${dateKey}:`) || key.endsWith(`:${dateKey}`)) {
      todayXp += val;
    }
  }
  return todayXp;
}

function inferCategoryAndTitleFromEventKey(eventKey: string): {
  category: XpLedgerCategory;
  title: string;
  dateKey: string;
} {
  const parts = eventKey.split(':');
  if (parts[0] === 'mission') {
    const dateKey = parts[1] || getLocalDateKey();
    const missionId = parts[2] || '';
    const found = initialMissions.find((m) => m.id === missionId);
    return {
      category: 'mission',
      title: found ? `Mission: ${found.title}` : `Mission (${missionId})`,
      dateKey,
    };
  }
  if (parts[0] === 'chest') {
    const dateKey = parts[1] || getLocalDateKey();
    return {
      category: 'chest',
      title: 'Daily Chest Reward',
      dateKey,
    };
  }
  if (parts[0] === 'break') {
    const dateKey = parts[1] || getLocalDateKey();
    const durPart = parts.find((p) => p.startsWith('dur'));
    const mins = durPart ? Number.parseInt(durPart.slice(3), 10) : NaN;
    return {
      category: 'focus_break',
      title: Number.isFinite(mins) && mins > 0 ? `${mins}-Minute Focus Break` : 'Focus Break Reset',
      dateKey,
    };
  }
  if (parts[0] === 'weekly') {
    const weekKey = parts[1] || getLocalWeekKey();
    const questId = parts[2] || '';
    const quest = INITIAL_WEEKLY_QUESTS.find((q) => q.id === questId);
    return {
      category: 'weekly_quest',
      title: quest ? `Weekly Quest: ${quest.title}` : `Weekly Quest (${questId})`,
      dateKey: weekKey.replace(/^week-/, ''),
    };
  }
  if (parts[0] === 'streak_recovery') {
    const dateKey = parts[1] || getLocalDateKey();
    return {
      category: 'streak',
      title: 'Streak Recovery Bonus',
      dateKey,
    };
  }
  return {
    category: 'mission',
    title: eventKey,
    dateKey: getLocalDateKey(),
  };
}

function appendXpTransaction(
  existingLedger: XpLedgerEntry[] | undefined,
  eventKey: string,
  title: string,
  amount: number,
  category: XpLedgerCategory,
  dateKey: string,
  timestampIso: string = new Date().toISOString()
): XpLedgerEntry[] {
  const current = Array.isArray(existingLedger) ? existingLedger : [];
  if (amount <= 0 || current.some((e) => e.eventKey === eventKey)) {
    return current;
  }
  const entry: XpLedgerEntry = {
    id: `xp-${eventKey}`,
    eventKey,
    title,
    amount,
    category,
    dateKey,
    timestamp: timestampIso,
  };
  return [entry, ...current];
}

/**
 * Returns the complete, ordered XP transaction ledger, reconciling any legacy claimedXpEvents
 * so that the sum of ledger entries always equals calculateTotalXp(state).
 */
export function getXpLedgerEntries(state: PersistedAppState): XpLedgerEntry[] {
  const savedLedger = Array.isArray(state.xpLedger) ? state.xpLedger : [];
  const byEventKey = new Map<string, XpLedgerEntry>();

  for (const entry of savedLedger) {
    if (entry && entry.eventKey && !byEventKey.has(entry.eventKey)) {
      byEventKey.set(entry.eventKey, entry);
    }
  }

  for (const [eventKey, amount] of Object.entries(state.claimedXpEvents)) {
    if (amount > 0 && !byEventKey.has(eventKey)) {
      const inferred = inferCategoryAndTitleFromEventKey(eventKey);
      byEventKey.set(eventKey, {
        id: `xp-${eventKey}`,
        eventKey,
        title: inferred.title,
        amount,
        category: inferred.category,
        dateKey: inferred.dateKey,
        timestamp: `${inferred.dateKey}T12:00:00.000Z`,
      });
    }
  }

  const earnedEntries = Array.from(byEventKey.values());
  const baselineEntry: XpLedgerEntry = {
    id: 'xp-baseline:initial',
    eventKey: 'baseline:initial',
    title: 'Starting Brain Bank Balance',
    amount: state.baseXp,
    category: 'baseline',
    dateKey: 'initial',
    timestamp: '2026-01-01T00:00:00.000Z',
  };

  return [...earnedEntries, baselineEntry];
}

export function verifyXpLedgerConsistency(state: PersistedAppState): {
  consistent: boolean;
  totalXp: number;
  ledgerSum: number;
} {
  const totalXp = calculateTotalXp(state);
  const ledger = getXpLedgerEntries(state);
  const ledgerSum = ledger.reduce((sum, item) => sum + item.amount, 0);
  return {
    consistent: totalXp === ledgerSum,
    totalXp,
    ledgerSum,
  };
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
 * Determines whether the user had meaningful healthy activity on `dateKey`.
 */
export function isDateActiveForStreak(
  state: PersistedAppState,
  dateKey: string,
  usageDisplay?: UsageDisplayState | null
): boolean {
  const missionsForDay = state.missionsByDate[dateKey];
  if (missionsForDay) {
    // Any non-default mission completed, or if the user earned XP on this date
    if (
      missionsForDay['touch-grass'] ||
      missionsForDay['brain-check-in'] ||
      missionsForDay['stay-under-target']
    ) {
      return true;
    }
  }

  if (calculateEarnedXpForDate(state, dateKey) > 0) {
    return true;
  }

  if (state.dailyChestByDate[dateKey]?.claimed) {
    return true;
  }

  if (state.moodLogsByDate?.[dateKey]) {
    return true;
  }

  if (state.lastFocusBreakAt === dateKey) {
    return true;
  }

  if (
    usageDisplay?.hasVerifiedEstimate &&
    usageDisplay.queryResult.estimatedMinutes !== null &&
    usageDisplay.queryResult.estimatedMinutes <= state.dailyLimitMinutes
  ) {
    return true;
  }

  const breakdownDay = state.cachedUsageSummary?.dailyBreakdown?.find(
    (d) => d.date === dateKey
  );
  if (
    breakdownDay &&
    breakdownDay.hasOsCoverage &&
    breakdownDay.foregroundMs > 0 &&
    Math.round(breakdownDay.foregroundMs / 60000) <= state.dailyLimitMinutes
  ) {
    return true;
  }

  return false;
}

/**
 * Evaluates daily streak, grace-day consumption, and weekly grace-day resets across local calendar dates.
 * Obeys BT-05: Never penalizes users when Usage Access is not granted or tracking is paused.
 */
export function evaluateStreakState(
  state: PersistedAppState,
  currentDateKey: string = getLocalDateKey(),
  usageDisplay?: UsageDisplayState | null
): PersistedAppState {
  const prevStreak = state.streak ?? createInitialStreakState(currentDateKey);

  let runningWeekKey = prevStreak.graceWeekKey || getLocalWeekKey(currentDateKey);
  let graceDaysRemaining = prevStreak.graceDaysRemaining;
  let recoveredThisWeek = prevStreak.recoveredThisWeek;

  const historyByDate = { ...prevStreak.historyByDate };
  let currentStreak = prevStreak.currentStreak;
  let longestStreak = prevStreak.longestStreak;
  let recoveryNeeded = prevStreak.recoveryNeeded;
  let previousStreakBeforeBreak = prevStreak.previousStreakBeforeBreak;

  const startEvalDate = prevStreak.lastEvaluatedDate || currentDateKey;
  const daysGap = Math.max(0, Math.min(30, diffLocalDays(startEvalDate, currentDateKey)));

  for (let step = 0; step <= daysGap; step++) {
    const evalKey = addLocalDays(startEvalDate, step);
    const evalWeekKey = getLocalWeekKey(evalKey);
    if (evalWeekKey !== runningWeekKey) {
      runningWeekKey = evalWeekKey;
      graceDaysRemaining = prevStreak.maxGraceDaysPerWeek || 1;
      recoveredThisWeek = false;
    }

    const isToday = evalKey === currentDateKey;
    const active = isDateActiveForStreak(
      state,
      evalKey,
      isToday ? usageDisplay : null
    );

    if (active) {
      const priorStatus = historyByDate[evalKey];
      historyByDate[evalKey] = 'completed';
      if (priorStatus !== 'completed') {
        if (step > 0 || currentStreak === 0) {
          currentStreak += 1;
        }
      }
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
    } else if (!isToday) {
      const priorStatus = historyByDate[evalKey];
      if (priorStatus === 'completed' || priorStatus === 'grace_used') {
        continue;
      }
      // Past missed day: check if protected by missing permission (BT-05) or available Grace Day
      const permissionMissing =
        state.consentStatus !== 'accepted' || !state.trackingEnabled;
      if (graceDaysRemaining > 0 || permissionMissing) {
        if (!permissionMissing && graceDaysRemaining > 0) {
          graceDaysRemaining -= 1;
        }
        historyByDate[evalKey] = 'grace_used';
      } else {
        historyByDate[evalKey] = 'missed';
        if (currentStreak > 0) {
          previousStreakBeforeBreak = currentStreak;
          recoveryNeeded = true;
        }
        currentStreak = 0;
      }
    } else {
      // Today is still in progress
      if (!historyByDate[evalKey]) {
        historyByDate[evalKey] = 'pending';
      }
    }
  }

  const nextStreak: StreakState = {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    lastEvaluatedDate: currentDateKey,
    graceDaysRemaining,
    maxGraceDaysPerWeek: prevStreak.maxGraceDaysPerWeek || 1,
    graceWeekKey: runningWeekKey,
    historyByDate,
    recoveryNeeded,
    previousStreakBeforeBreak,
    recoveredThisWeek,
  };

  return {
    ...state,
    streak: nextStreak,
  };
}

/**
 * Recovers a broken streak once per week after the user completes a healthy action today.
 */
export function recoverStreakState(
  state: PersistedAppState,
  dateKey: string = getLocalDateKey()
): StateTransitionResult {
  const evaluated = evaluateStreakState(state, dateKey);
  const streak = evaluated.streak;

  if (!streak.recoveryNeeded || streak.previousStreakBeforeBreak <= 0) {
    return {
      nextState: evaluated,
      xpAwarded: 0,
      newlyUnlockedBadge: null,
      celebration: null,
      toastMessage: 'Your streak is already active—no recovery needed.',
    };
  }

  if (streak.recoveredThisWeek) {
    return {
      nextState: evaluated,
      xpAwarded: 0,
      newlyUnlockedBadge: null,
      celebration: null,
      toastMessage: 'Streak recovery has already been used this week.',
    };
  }

  if (!isDateActiveForStreak(evaluated, dateKey)) {
    return {
      nextState: evaluated,
      xpAwarded: 0,
      newlyUnlockedBadge: null,
      celebration: null,
      toastMessage: 'Complete 1 mission or focus break today to unlock streak recovery.',
    };
  }

  const restoredStreak = streak.previousStreakBeforeBreak + 1;
  const eventKey = `streak_recovery:${dateKey}:${streak.graceWeekKey}`;
  const alreadyClaimed = Boolean(evaluated.claimedXpEvents[eventKey]);
  const xpAwarded = alreadyClaimed ? 0 : STREAK_RECOVERY_XP_REWARD;

  const nextClaimed = alreadyClaimed
    ? evaluated.claimedXpEvents
    : {
        ...evaluated.claimedXpEvents,
        [eventKey]: STREAK_RECOVERY_XP_REWARD,
      };

  const nextLedger = alreadyClaimed
    ? evaluated.xpLedger
    : appendXpTransaction(
        evaluated.xpLedger,
        eventKey,
        'Streak Recovery Bonus',
        STREAK_RECOVERY_XP_REWARD,
        'streak',
        dateKey
      );

  const nextState: PersistedAppState = {
    ...evaluated,
    claimedXpEvents: nextClaimed,
    xpLedger: nextLedger,
    streak: {
      ...streak,
      currentStreak: restoredStreak,
      longestStreak: Math.max(streak.longestStreak, restoredStreak),
      recoveryNeeded: false,
      previousStreakBeforeBreak: 0,
      recoveredThisWeek: true,
      historyByDate: {
        ...streak.historyByDate,
        [dateKey]: 'completed',
      },
    },
  };

  return {
    nextState,
    xpAwarded,
    newlyUnlockedBadge: null,
    celebration: {
      title: `${restoredStreak}-Day Streak Restored`,
      detail: 'One missed day does not erase your progress.',
      reward: xpAwarded > 0 ? `+${xpAwarded} XP · STREAK RECOVERED` : 'STREAK RECOVERED',
      iconName: 'flame',
      kind: 'mission',
    },
    toastMessage: `Streak recovered to ${restoredStreak} days!${
      xpAwarded > 0 ? ` +${xpAwarded} XP` : ''
    }`,
  };
}

/**
 * Toggles or completes a mission for `dateKey` while guaranteeing XP idempotency:
 * Completing the same mission multiple times on the same dateKey never awards duplicate XP (FR-008, AT-06).
 */
export function toggleMissionState(
  state: PersistedAppState,
  missionIndex: number,
  dateKey: string = getLocalDateKey(),
  forceComplete = false,
  usageDisplay?: UsageDisplayState | null,
  effectiveLimitMinutes?: number
): StateTransitionResult {
  const currentMissions = getMissionsForDate(
    state,
    dateKey,
    usageDisplay,
    effectiveLimitMinutes
  );
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

  // Protect usage-linked missions from fake manual completion when UsageDisplayState is supplied
  if (
    target.usageLinked &&
    !forceComplete &&
    !target.done &&
    usageDisplay !== undefined &&
    usageDisplay !== null
  ) {
    if (
      !usageDisplay.hasVerifiedEstimate ||
      usageDisplay.queryResult.estimatedMinutes === null
    ) {
      return {
        nextState: state,
        xpAwarded: 0,
        newlyUnlockedBadge: null,
        celebration: null,
        toastMessage:
          'Grant Usage Access first so ROT can verify your Instagram scroll target.',
      };
    }
    const limitMins = clampDailyLimitMinutes(
      effectiveLimitMinutes ?? state.dailyLimitMinutes
    );
    if (usageDisplay.queryResult.estimatedMinutes > limitMins) {
      return {
        nextState: state,
        xpAwarded: 0,
        newlyUnlockedBadge: null,
        celebration: null,
        toastMessage:
          'Today’s estimate is over your target. Adjust your target or reset tomorrow!',
      };
    }
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

  const nextLedger =
    xpAwarded > 0
      ? appendXpTransaction(
          state.xpLedger,
          eventKey,
          `Mission: ${target.title}`,
          xpAwarded,
          'mission',
          dateKey
        )
      : state.xpLedger;

  const { unlockedBadges, newlyUnlockedBadge } = syncUnlockedBadges(
    state,
    nextMissions,
    state.completedFocusBreaks,
    dateKey
  );

  let nextState: PersistedAppState = {
    ...state,
    claimedXpEvents: nextClaimedEvents,
    xpLedger: nextLedger,
    missionsByDate: {
      ...state.missionsByDate,
      [dateKey]: nextDateMap,
    },
    unlockedBadges,
  };

  nextState = evaluateStreakState(nextState, dateKey, usageDisplay);
  nextState = syncWeeklyQuestsState(nextState, dateKey);

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

/**
 * Automatically updates usage-linked missions from verified device usage.
 * Never awards fake or duplicate progress when permissions are missing or usage is over target.
 */
export function syncUsageLinkedMissionsState(
  state: PersistedAppState,
  usageDisplay: UsageDisplayState,
  effectiveLimitMinutes: number,
  dateKey: string = getLocalDateKey()
): StateTransitionResult {
  if (
    !usageDisplay.hasVerifiedEstimate ||
    usageDisplay.queryResult.estimatedMinutes === null
  ) {
    return {
      nextState: evaluateStreakState(state, dateKey, usageDisplay),
      xpAwarded: 0,
      newlyUnlockedBadge: null,
      celebration: null,
      toastMessage: '',
    };
  }

  const limitMins = clampDailyLimitMinutes(effectiveLimitMinutes);
  const usedMins = usageDisplay.queryResult.estimatedMinutes;
  const missions = getMissionsForDate(state, dateKey, usageDisplay, limitMins);
  const underTargetIdx = missions.findIndex((m) => m.id === 'stay-under-target');

  if (underTargetIdx >= 0 && usedMins <= limitMins && !missions[underTargetIdx].done) {
    return toggleMissionState(
      state,
      underTargetIdx,
      dateKey,
      true,
      usageDisplay,
      limitMins
    );
  }

  const evaluated = syncWeeklyQuestsState(
    evaluateStreakState(state, dateKey, usageDisplay),
    dateKey
  );
  return {
    nextState: evaluated,
    xpAwarded: 0,
    newlyUnlockedBadge: null,
    celebration: null,
    toastMessage: '',
  };
}

/**
 * Evaluates weekly quest progress for the Monday-anchored week of `dateKey`.
 * Resets automatically when a new week starts.
 */
export function getWeeklyQuestState(
  state: PersistedAppState,
  dateKey: string = getLocalDateKey()
): WeeklyQuestState {
  const weekKey = getLocalWeekKey(dateKey);
  const weekDates = getDatesInWeek(weekKey);
  const existingWeek = state.weeklyQuestsByWeek?.[weekKey];

  // 1. Balanced Week: count days in week with at least 1 mission done (excluding default pre-checked limit unless earned XP or another mission done)
  let activeMissionDays = 0;
  for (const d of weekDates) {
    const map = state.missionsByDate[d];
    if (!map) continue;
    const completedAny =
      Boolean(map['touch-grass']) ||
      Boolean(map['brain-check-in']) ||
      Boolean(map['stay-under-target']) ||
      Object.keys(state.claimedXpEvents).some((k) => k.startsWith(`mission:${d}:`));
    if (completedAny) {
      activeMissionDays += 1;
    }
  }

  // 2. Focus Break Master: count focus breaks in week
  let weeklyBreaks = 0;
  for (const key of Object.keys(state.claimedXpEvents)) {
    if (key.startsWith('break:')) {
      const parts = key.split(':');
      if (parts[1] && weekDates.includes(parts[1])) {
        weeklyBreaks += 1;
      }
    }
  }

  // 3. Target Guardian: count verified days under target in week
  const underTargetDaysSet = new Set<string>();
  for (const d of weekDates) {
    if (state.missionsByDate[d]?.['stay-under-target']) {
      underTargetDaysSet.add(d);
    }
  }
  const breakdown = state.cachedUsageSummary?.dailyBreakdown ?? [];
  for (const pt of breakdown) {
    if (
      weekDates.includes(pt.date) &&
      pt.hasOsCoverage &&
      pt.foregroundMs >= 0 &&
      pt.source !== 'zero_or_empty' &&
      Math.round(pt.foregroundMs / 60000) <= state.dailyLimitMinutes
    ) {
      underTargetDaysSet.add(pt.date);
    }
  }
  const underTargetDays = underTargetDaysSet.size;

  const progressMap: Record<WeeklyQuestId, number> = {
    'balanced-week': activeMissionDays,
    'focus-master': weeklyBreaks,
    'under-target-week': underTargetDays,
  };

  const quests: WeeklyQuest[] = INITIAL_WEEKLY_QUESTS.map((template) => {
    const prevQuest = existingWeek?.quests.find((q) => q.id === template.id);
    const rawProgress = progressMap[template.id] ?? 0;
    const progress = Math.min(template.target, rawProgress);
    const completed = progress >= template.target || Boolean(prevQuest?.completed);
    const eventKey = `weekly:${weekKey}:${template.id}`;
    const claimed =
      Boolean(prevQuest?.claimed) || Boolean(state.claimedXpEvents[eventKey]);
    return {
      ...template,
      progress,
      completed,
      claimed,
    };
  });

  return {
    weekKey,
    quests,
  };
}

export function syncWeeklyQuestsState(
  state: PersistedAppState,
  dateKey: string = getLocalDateKey()
): PersistedAppState {
  const weekState = getWeeklyQuestState(state, dateKey);
  return {
    ...state,
    weeklyQuestsByWeek: {
      ...(state.weeklyQuestsByWeek ?? {}),
      [weekState.weekKey]: weekState,
    },
  };
}

export function claimWeeklyQuestState(
  state: PersistedAppState,
  questId: WeeklyQuestId,
  dateKey: string = getLocalDateKey()
): StateTransitionResult {
  const weekState = getWeeklyQuestState(state, dateKey);
  const quest = weekState.quests.find((q) => q.id === questId);

  if (!quest) {
    return {
      nextState: state,
      xpAwarded: 0,
      newlyUnlockedBadge: null,
      celebration: null,
      toastMessage: '',
    };
  }

  if (!quest.completed) {
    return {
      nextState: state,
      xpAwarded: 0,
      newlyUnlockedBadge: null,
      celebration: null,
      toastMessage: `Keep going: ${quest.progress}/${quest.target} toward ${quest.title}.`,
    };
  }

  const eventKey = `weekly:${weekState.weekKey}:${quest.id}`;
  if (quest.claimed || state.claimedXpEvents[eventKey]) {
    return {
      nextState: state,
      xpAwarded: 0,
      newlyUnlockedBadge: null,
      celebration: null,
      toastMessage: `${quest.title} reward already claimed this week.`,
    };
  }

  const nextQuests = weekState.quests.map((q) =>
    q.id === questId ? { ...q, claimed: true } : q
  );

  const nextLedger = appendXpTransaction(
    state.xpLedger,
    eventKey,
    `Weekly Quest: ${quest.title}`,
    quest.rewardXp,
    'weekly_quest',
    dateKey
  );

  const nextState: PersistedAppState = {
    ...state,
    claimedXpEvents: {
      ...state.claimedXpEvents,
      [eventKey]: quest.rewardXp,
    },
    xpLedger: nextLedger,
    weeklyQuestsByWeek: {
      ...(state.weeklyQuestsByWeek ?? {}),
      [weekState.weekKey]: {
        weekKey: weekState.weekKey,
        quests: nextQuests,
      },
    },
  };

  return {
    nextState,
    xpAwarded: quest.rewardXp,
    newlyUnlockedBadge: null,
    celebration: {
      title: 'Weekly quest complete',
      detail: quest.title,
      reward: `+${quest.rewardXp} XP · WEEKLY REWARD`,
      iconName: 'trophy',
      kind: 'mission',
    },
    toastMessage: `+${quest.rewardXp} XP claimed for ${quest.title}!`,
  };
}

/**
 * Logs the user's daily mood check-in with an optional reflection note, persists by dateKey,
 * and automatically completes the "Do the brain check-in" mission.
 */
export function logDailyMoodState(
  state: PersistedAppState,
  moodId: MoodId,
  rawNote: string = '',
  dateKey: string = getLocalDateKey(),
  nowIso: string = new Date().toISOString()
): StateTransitionResult {
  const option =
    MOOD_OPTIONS.find((m) => m.id === moodId) ?? MOOD_OPTIONS[0];
  const note = rawNote.replace(/\s+/g, ' ').trim().slice(0, MAX_MOOD_NOTE_LENGTH);

  const entry: MoodLogEntry = {
    dateKey,
    moodId: option.id,
    emoji: option.emoji,
    label: option.label,
    note,
    loggedAt: nowIso,
  };

  let workingState: PersistedAppState = {
    ...state,
    moodLogsByDate: {
      ...(state.moodLogsByDate ?? {}),
      [dateKey]: entry,
    },
  };

  const currentMissions = getMissionsForDate(state, dateKey);
  const checkInIdx = currentMissions.findIndex((m) => m.id === 'brain-check-in');

  let xpAwarded = 0;
  let newlyUnlockedBadge: Badge | null = null;
  let celebration: Celebration | null = null;

  if (checkInIdx >= 0 && !state.missionsByDate[dateKey]?.['brain-check-in']) {
    const res = toggleMissionState(workingState, checkInIdx, dateKey, true);
    workingState = res.nextState;
    xpAwarded = res.xpAwarded;
    newlyUnlockedBadge = res.newlyUnlockedBadge;
    celebration = res.celebration;
  } else {
    workingState = evaluateStreakState(workingState, dateKey);
  }

  return {
    nextState: workingState,
    xpAwarded,
    newlyUnlockedBadge,
    celebration,
    toastMessage:
      xpAwarded > 0
        ? `Mood logged (${option.shortLabel}) · +${xpAwarded} XP for Brain Check-In!`
        : `Mood updated to "${option.label}".`,
  };
}

export function isWithinQuietHours(
  settings: UserSettings,
  currentHour: number = new Date().getHours()
): boolean {
  if (settings.quietHoursEnabled === false) return false;
  const start = settings.quietStartHour ?? 22;
  const end = settings.quietEndHour ?? 8;
  if (start === end) return false;
  if (start > end) {
    return currentHour >= start || currentHour < end;
  }
  return currentHour >= start && currentHour < end;
}

/**
 * Evaluates which local notifications should fire based on user preferences, quiet hours,
 * usage progress, missions, and streak status, ensuring each notification key fires at most once per dateKey.
 */
export function evaluatePendingNotifications(
  state: PersistedAppState,
  usageDisplay: UsageDisplayState,
  limitProgress: LimitProgressSummary,
  dateKey: string = getLocalDateKey(),
  currentHour: number = new Date().getHours()
): {
  nextState: PersistedAppState;
  notifications: PendingLocalNotification[];
} {
  if (isWithinQuietHours(state.settings, currentHour)) {
    return { nextState: state, notifications: [] };
  }

  const sentToday = new Set<string>(state.sentNotificationsByDate?.[dateKey] ?? []);
  const notifications: PendingLocalNotification[] = [];

  if (state.settings.dailyGentleNudge && usageDisplay.hasVerifiedEstimate) {
    if (limitProgress.isOverLimit && !sentToday.has('limit_100')) {
      sentToday.add('limit_100');
      notifications.push({
        id: 1001,
        key: 'limit_100',
        title: 'Daily scroll target reached',
        body: 'You passed your daily Instagram target. No guilt—a focus break is a great way to reset.',
        category: 'limit_100',
      });
    } else if (limitProgress.isNearLimit && !sentToday.has('limit_80')) {
      sentToday.add('limit_80');
      notifications.push({
        id: 1002,
        key: 'limit_80',
        title: 'Gentle scroll nudge',
        body:
          limitProgress.nudgeMessage ||
          'You have reached 80% of today’s scroll target.',
        category: 'limit_80',
      });
    }
  }

  const eveningHour = state.settings.eveningReminderHour ?? 19;
  if (
    state.settings.missionReminders &&
    currentHour >= eveningHour &&
    !sentToday.has('mission_reminder')
  ) {
    const missions = getMissionsForDate(state, dateKey, usageDisplay);
    const anyCompleted = missions.some((m) => m.done && m.id !== 'set-scroll-limit');
    if (!anyCompleted) {
      sentToday.add('mission_reminder');
      notifications.push({
        id: 1003,
        key: 'mission_reminder',
        title: 'Tiny reset check-in',
        body: 'Complete one quick mission or mood check-in to grow your brain bank today.',
        category: 'mission_reminder',
      });
    }
  }

  const streakHour = state.settings.streakReminderHour ?? 21;
  if (
    state.settings.streakReminders &&
    currentHour >= streakHour &&
    !sentToday.has('streak_reminder') &&
    state.streak?.currentStreak > 0 &&
    !isDateActiveForStreak(state, dateKey, usageDisplay)
  ) {
    sentToday.add('streak_reminder');
    notifications.push({
      id: 1004,
      key: 'streak_reminder',
      title: `Keep your ${state.streak.currentStreak}-day streak going`,
      body: 'Take a quick focus break or log your brain mood before midnight.',
      category: 'streak_reminder',
    });
  }

  if (state.settings.achievementNotifications !== false) {
    const unlockedEntries = Object.entries(state.unlockedBadges ?? {}).filter(
      ([, unlockedOn]) => unlockedOn === dateKey
    );
    if (unlockedEntries.length > 0 && !sentToday.has(`badge_unlocked_${unlockedEntries.length}`)) {
      // Only mark once per badge milestone count on that day if a non-default badge unlocked
      const nonDefault = unlockedEntries.filter(([id]) => id !== 'first-flight' && id !== 'limit-setter');
      if (nonDefault.length > 0 && !sentToday.has('achievement_badge_today')) {
        sentToday.add('achievement_badge_today');
        notifications.push({
          id: 1006,
          key: 'achievement_badge_today',
          title: 'New ROT Badge Unlocked!',
          body: `You unlocked ${nonDefault.length} new badge${nonDefault.length > 1 ? 's' : ''} today. Check your Card or Badges tab!`,
          category: 'achievement',
        });
      }
    }
  }

  if (notifications.length === 0) {
    return { nextState: state, notifications: [] };
  }

  const nextState: PersistedAppState = {
    ...state,
    sentNotificationsByDate: {
      ...(state.sentNotificationsByDate ?? {}),
      [dateKey]: Array.from(sentToday),
    },
  };

  return { nextState, notifications };
}

export function calculatePlayerLevel(totalXp: number): PlayerLevelInfo {
  const safeXp = Math.max(0, Math.round(totalXp));
  const STEP = 100;
  const level = Math.max(1, Math.floor(safeXp / STEP) + 1);
  const currentLevelFloorXp = (level - 1) * STEP;
  const nextLevelXp = level * STEP;
  const progressPercent = Math.max(
    0,
    Math.min(100, Math.round(((safeXp - currentLevelFloorXp) / STEP) * 100))
  );

  const titles = [
    'Scroll Curious',
    'Tab Closer',
    'Soft Launcher',
    'Mindful Scroller',
    'Focus Apprentice',
    'Balance Builder',
    'Grass Toucher',
    'Offline Explorer',
    'Brainrot Tamer',
    'Offline Legend',
  ];
  const title = titles[Math.min(titles.length - 1, level - 1)];

  return {
    level,
    title,
    currentLevelFloorXp,
    nextLevelXp,
    progressPercent,
  };
}

export function formatCardExportFilename(
  cardType: CardType,
  displayName: string,
  dateKey: string = getLocalDateKey(),
  format: CardExportFormat = 'feed'
): string {
  const cleanName = (displayName || 'User')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_-]/g, '')
    .slice(0, 20) || 'User';
  const cleanDate = dateKey.replace(/[^0-9]/g, '').slice(0, 8) || '20261115';
  const typePrefix =
    cardType === 'archetype' ? 'ROT_Archetype' : 'ROT_Weekly_Achievement';
  const suffix = format === 'story' ? '_Story' : '';
  return `${typePrefix}_${cleanName}_${cleanDate}${suffix}.png`;
}

export function buildWeeklyAchievementSummary(
  state: PersistedAppState,
  dateKey: string = getLocalDateKey()
): WeeklyAchievementSummary {
  const weekKey = getLocalWeekKey(dateKey);
  const weekStartStr = weekKey.replace(/^week-/, '');
  const weekStartDate = parseLocalDateKey(weekStartStr);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 6);
  const weekEndStr = `${weekEndDate.getFullYear()}-${String(
    weekEndDate.getMonth() + 1
  ).padStart(2, '0')}-${String(weekEndDate.getDate()).padStart(2, '0')}`;

  const ledger = getXpLedgerEntries(state);
  const weeklyXpEarned = ledger
    .filter(
      (entry) =>
        entry.category !== 'baseline' &&
        entry.dateKey >= weekStartStr &&
        entry.dateKey <= weekEndStr
    )
    .reduce((sum, entry) => sum + entry.amount, 0);

  let missionsCompletedThisWeek = 0;
  for (const [dKey, map] of Object.entries(state.missionsByDate ?? {})) {
    if (dKey >= weekStartStr && dKey <= weekEndStr) {
      missionsCompletedThisWeek += Object.values(map).filter(Boolean).length;
    }
  }

  const weeklyQuestState = getWeeklyQuestState(state, dateKey);
  const weeklyQuestsCompleted = weeklyQuestState.quests.filter(
    (q) => q.completed
  ).length;
  const weeklyQuestsTotal = weeklyQuestState.quests.length;

  const todayMissions = getMissionsForDate(state, dateKey);
  const badges = getBadges(
    todayMissions,
    state.completedFocusBreaks,
    state.unlockedBadges
  );
  const unlockedBadges = badges.filter((b) => b.unlocked);
  const unlockedBadgeNames = unlockedBadges.map((b) => b.name);
  const currentStreak = state.streak?.currentStreak ?? 0;

  const hasAnyProgress =
    weeklyXpEarned > 0 ||
    missionsCompletedThisWeek > 0 ||
    weeklyQuestsCompleted > 0 ||
    unlockedBadges.length > 0;

  let headline = 'YOUR RESET BEGINS.';
  let tagline = 'Complete a mission or focus break to start your weekly highlight reel.';
  if (weeklyQuestsCompleted >= 2 || weeklyXpEarned >= 250) {
    headline = 'YOUR WEEK, YOUR RULES.';
    tagline = 'Real resets, steady streaks, and zero feed guilt.';
  } else if (weeklyXpEarned >= 100 || missionsCompletedThisWeek >= 3) {
    headline = 'SMALL WINS. BIG XP.';
    tagline = 'Showing up offline adds up faster than doomscrolling.';
  } else if (hasAnyProgress) {
    headline = 'LESS SCROLL. MORE CONTROL.';
    tagline = 'Every intentional break puts you back in charge of your attention.';
  }

  return {
    weekKey,
    weekLabel: `WEEK OF ${weekStartStr}`,
    hasAnyProgress,
    weeklyXpEarned,
    missionsCompletedThisWeek,
    weeklyQuestsCompleted,
    weeklyQuestsTotal,
    currentStreak,
    unlockedBadgeNames,
    unlockedBadgesCount: unlockedBadges.length,
    totalBadgesCount: badges.length,
    headline,
    tagline,
    heroMetricLabel: hasAnyProgress ? 'XP EARNED THIS WEEK' : 'READY FOR DAY ONE',
    heroMetricValue: hasAnyProgress ? `+${weeklyXpEarned}` : '0 XP',
  };
}

/**
 * Builds and validates a structured JSON export of the user's local ROT data.
 */
export function buildUserDataExport(
  state: PersistedAppState,
  nowIso: string = new Date().toISOString()
): UserDataExportPayload {
  const identity = resolveEffectiveDisplayName(state.profile);
  const ledger = getXpLedgerEntries(state);
  const consistency = verifyXpLedgerConsistency(state);
  const earnedXp = Object.values(state.claimedXpEvents).reduce(
    (sum, val) => sum + val,
    0
  );

  return {
    format: 'rot-user-data-export-v1',
    exportedAt: nowIso,
    schemaVersion: state.schemaVersion,
    profile: {
      effectiveDisplayName: identity.displayName,
      source: identity.source,
      customDisplayName: state.profile.customDisplayName,
      deviceDefaultName: state.profile.deviceDefaultName,
    },
    settings: { ...state.settings },
    dailyLimitMinutes: state.dailyLimitMinutes,
    streak: { ...state.streak },
    xpSummary: {
      totalXp: consistency.totalXp,
      baseXp: state.baseXp,
      earnedXp,
      ledgerConsistent: consistency.consistent,
      ledger,
    },
    missionsByDate: { ...state.missionsByDate },
    weeklyQuestsByWeek: { ...(state.weeklyQuestsByWeek ?? {}) },
    moodLogsByDate: { ...(state.moodLogsByDate ?? {}) },
    usageSummary: {
      consentStatus: state.consentStatus,
      trackingEnabled: state.trackingEnabled,
      cachedUsageSummary: state.cachedUsageSummary,
    },
  };
}

export function serializeUserDataExportJson(
  state: PersistedAppState,
  nowIso: string = new Date().toISOString()
): {
  ok: boolean;
  json: string;
  filename: string;
  payload: UserDataExportPayload | null;
  error: string | null;
} {
  try {
    const payload = buildUserDataExport(state, nowIso);
    const json = JSON.stringify(payload, null, 2);
    // Verify valid JSON round-trip
    const parsed = JSON.parse(json);
    if (!parsed || parsed.format !== 'rot-user-data-export-v1') {
      throw new Error('Export validation failed');
    }
    const datePart = nowIso.slice(0, 10);
    return {
      ok: true,
      json,
      filename: `rot-brainrot-export-${datePart}.json`,
      payload,
      error: null,
    };
  } catch (err: any) {
    return {
      ok: false,
      json: '',
      filename: '',
      payload: null,
      error: err?.message || 'Unable to generate JSON export.',
    };
  }
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

  const nextLedger = appendXpTransaction(
    state.xpLedger,
    eventKey,
    `Daily Chest (${updatedChest.item})`,
    DAILY_CHEST_XP_REWARD,
    'chest',
    dateKey
  );

  let nextState: PersistedAppState = {
    ...state,
    claimedXpEvents: {
      ...state.claimedXpEvents,
      [eventKey]: DAILY_CHEST_XP_REWARD,
    },
    xpLedger: nextLedger,
    dailyChestByDate: {
      ...state.dailyChestByDate,
      [dateKey]: updatedChest,
    },
  };

  nextState = evaluateStreakState(nextState, dateKey);

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
  dateKey: string = getLocalDateKey(),
  durationMinutes: number = 10
): StateTransitionResult {
  const safeDuration = Math.max(1, Math.round(durationMinutes));
  const breakEventKey = `break:${dateKey}:${sessionId}:dur${safeDuration}`;
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

  const nextLedger = appendXpTransaction(
    state.xpLedger,
    breakEventKey,
    `${safeDuration}-Minute Focus Break`,
    FOCUS_BREAK_XP_REWARD,
    'focus_break',
    dateKey
  );

  let workingState: PersistedAppState = {
    ...state,
    completedFocusBreaks: nextFocusBreaks,
    lastFocusBreakAt: dateKey,
    claimedXpEvents: {
      ...state.claimedXpEvents,
      [breakEventKey]: FOCUS_BREAK_XP_REWARD,
    },
    xpLedger: nextLedger,
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

  let finalState: PersistedAppState = {
    ...workingState,
    unlockedBadges,
  };

  finalState = evaluateStreakState(finalState, dateKey);
  finalState = syncWeeklyQuestsState(finalState, dateKey);

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
  const weekKey = getLocalWeekKey(dateKey);
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
        'stay-under-target': false,
      },
    },
    dailyChestByDate: {},
    unlockedBadges: {},
    completedFocusBreaks: 0,
    lastFocusBreakAt: null,
    cachedUsageSummary: null,
    streak: {
      ...createInitialStreakState(dateKey),
      currentStreak: 0,
      longestStreak: 0,
      historyByDate: {
        [dateKey]: 'pending',
      },
    },
    weeklyQuestsByWeek: {
      [weekKey]: createInitialWeeklyQuestState(weekKey),
    },
    moodLogsByDate: {},
    xpLedger: [],
    sentNotificationsByDate: {},
  };
}

export function formatUnreadBadgeCount(count: number): string | null {
  if (!Number.isFinite(count) || count <= 0) return null;
  const whole = Math.floor(count);
  if (whole <= 0) return null;
  return whole > 99 ? '99+' : String(whole);
}
