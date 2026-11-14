export type View = 'Today' | 'Missions' | 'Badges' | 'Leaderboard' | 'Card' | 'Settings';

export type MissionId = 'touch-grass' | 'set-scroll-limit' | 'brain-check-in';

export type Mission = {
  id: MissionId;
  title: string;
  detail: string;
  reward: number;
  iconName: string;
  iconColor: string;
  iconBg: string;
  done: boolean;
};

export type BadgeId =
  | 'first-flight'
  | 'limit-setter'
  | 'grass-toucher'
  | 'brain-check'
  | 'soft-launcher'
  | 'offline-icon';

export type Badge = {
  id: BadgeId;
  name: string;
  description: string;
  requirement: string;
  iconName: string;
  color: string;
  unlocked: boolean;
  unlockedAt?: string;
};

export type Celebration = {
  title: string;
  detail: string;
  reward: string;
  iconName: string;
  kind: 'mission' | 'badge' | 'chest';
};

export type DailyChest = {
  claimed: boolean;
  item: string;
};

export type LeaderboardTab = 'Friends' | 'Squad' | 'Campus';

export type Ranking = {
  name: string;
  handle: string;
  initials: string;
  xp: number;
  change: string;
  current?: boolean;
};

export type ConsentStatus = 'pending' | 'accepted' | 'declined';

export type UsageDataStatus =
  | 'ok'
  | 'zero_usage'
  | 'permission_required'
  | 'tracking_paused'
  | 'not_installed'
  | 'no_os_record'
  | 'query_failed'
  | 'stale'
  | 'incomplete'
  | 'unavailable'
  | 'tracking_disabled';

export type DailyUsagePoint = {
  date: string;
  dayLabel: string;
  foregroundMs: number;
  sessionCount: number;
  hasOsCoverage: boolean;
  source: 'usage_events' | 'daily_aggregate' | 'zero_or_empty';
};

export type InstagramUsageSummary = {
  status: UsageDataStatus;
  statusReason: string;
  permissionGranted: boolean;
  instagramInstalled: boolean;
  todayForegroundMs: number | null;
  todaySessionCount?: number;
  queriedAtMs: number;
  dailyBreakdown: DailyUsagePoint[];
  aggregationSource?: string;
  isComplete?: boolean | 'unknown';
  errorCode?: string;
  deviceName?: string;
  manufacturer?: string;
  model?: string;
  sdkInt?: number;
};

export type UsageQueryResult = {
  status: UsageDataStatus;
  estimatedMinutes: number | null;
  lastUpdatedAt: number | null;
  source: string;
  isComplete: boolean | 'unknown';
  errorCode?: string;
};

export type UserProfile = {
  customDisplayName: string | null;
  deviceDefaultName: string | null;
};

export type UserSettings = {
  dailyGentleNudge: boolean;
  privateMode: boolean;
  weekendBreathingRoom: boolean;
};

export type PersistedAppState = {
  schemaVersion: number;
  consentStatus: ConsentStatus;
  consentUpdatedAt: string | null;
  trackingEnabled: boolean;
  dailyLimitMinutes: number;
  profile: UserProfile;
  settings: UserSettings;
  baseXp: number;
  claimedXpEvents: Record<string, number>;
  missionsByDate: Record<string, Record<string, boolean>>;
  dailyChestByDate: Record<string, DailyChest>;
  unlockedBadges: Record<string, string>;
  completedFocusBreaks: number;
  lastFocusBreakAt: string | null;
  cachedUsageSummary: InstagramUsageSummary | null;
};
