export type View = 'Today' | 'Missions' | 'Badges' | 'Leaderboard' | 'Card' | 'Settings';

export type Mission = {
  title: string;
  detail: string;
  reward: number;
  iconName: string;
  iconColor: string;
  iconBg: string;
  done: boolean;
};

export type Badge = {
  name: string;
  description: string;
  requirement: string;
  iconName: string;
  color: string;
  unlocked: boolean;
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
