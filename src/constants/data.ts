import {
  Badge,
  LeaderboardTab,
  Mission,
  MoodOption,
  Ranking,
  WeeklyQuest,
} from './types';

export const initialMissions: Mission[] = [
  {
    id: 'touch-grass',
    title: 'Touch some grass',
    detail: 'Take a 10 minute offline reset',
    reward: 40,
    iconName: 'leaf',
    iconColor: '#572b92',
    iconBg: '#eee7fa',
    done: false,
  },
  {
    id: 'set-scroll-limit',
    title: 'Set a scroll limit',
    detail: 'Choose a kinder target for today',
    reward: 35,
    iconName: 'clock',
    iconColor: '#ce6d24',
    iconBg: '#fff1d8',
    done: true,
  },
  {
    id: 'brain-check-in',
    title: 'Do the brain check-in',
    detail: 'Name one thing you want to make time for',
    reward: 25,
    iconName: 'brain',
    iconColor: '#f32c87',
    iconBg: '#ffe4ef',
    done: false,
  },
  {
    id: 'stay-under-target',
    title: 'Keep scroll under target',
    detail: 'Verified Instagram usage stays within your daily target',
    reward: 45,
    iconName: 'shield-check',
    iconColor: '#2d9364',
    iconBg: '#e4f8ee',
    done: false,
    usageLinked: true,
  },
];

export const MOOD_OPTIONS: MoodOption[] = [
  {
    id: 'balanced',
    emoji: '◡',
    label: 'Chill and balanced',
    shortLabel: 'Balanced',
  },
  {
    id: 'curious',
    emoji: '◠',
    label: 'Chill but curious',
    shortLabel: 'Curious',
  },
  {
    id: 'cooked',
    emoji: '≈',
    label: 'Slightly cooked, ready to reset',
    shortLabel: 'Cooked',
  },
  {
    id: 'offline_reset',
    emoji: '✦',
    label: 'Offline & unbothered',
    shortLabel: 'Offline',
  },
];

export const INITIAL_WEEKLY_QUESTS: Omit<
  WeeklyQuest,
  'progress' | 'completed' | 'claimed'
>[] = [
  {
    id: 'balanced-week',
    title: 'Balanced Week',
    detail: 'Complete at least 1 mission on 3 different days this week',
    target: 3,
    rewardXp: 90,
    iconName: 'star',
  },
  {
    id: 'focus-master',
    title: 'Focus Break Master',
    detail: 'Complete 2 focus break resets during the week',
    target: 2,
    rewardXp: 80,
    iconName: 'clock',
  },
  {
    id: 'under-target-week',
    title: 'Target Guardian',
    detail: 'Stay within your daily Instagram target on 3 verified days',
    target: 3,
    rewardXp: 110,
    iconName: 'shield-check',
  },
];

export const dailyItems = [
  'Soft Reset sticker',
  'Golden brain pin',
  'Offline icon',
  'Tiny victory badge',
];

export const DAILY_LIMIT_OPTIONS = [
  { label: '30m', minutes: 30 },
  { label: '1h 00m', minutes: 60 },
  { label: '1h 30m', minutes: 90 },
  { label: '2h 00m', minutes: 120 },
  { label: '3h 00m', minutes: 180 },
];

export const rankings: Record<LeaderboardTab, Ranking[]> = {
  Friends: [
    { name: 'Nadia', handle: 'nightshift.nadia', initials: 'N', xp: 391, change: '+42 XP' },
    { name: 'You', handle: 'rot.resets', initials: 'Y', xp: 284, change: '+75 XP', current: true },
    { name: 'Tariq', handle: 'tariq.scrolls', initials: 'T', xp: 242, change: '+28 XP' },
    { name: 'Mina', handle: 'minamakes', initials: 'M', xp: 198, change: '+19 XP' },
    { name: 'Jules', handle: 'julesoffline', initials: 'J', xp: 154, change: '+12 XP' },
  ],
  Squad: [
    { name: 'Team Grass', handle: 'the offline club', initials: 'T', xp: 1180, change: '+240 XP' },
    { name: 'You', handle: 'rot.resets', initials: 'Y', xp: 284, change: '+75 XP', current: true },
    { name: 'Slow Scrolls', handle: 'the gentle gang', initials: 'S', xp: 240, change: '+64 XP' },
    { name: 'The Break Room', handle: 'pause enthusiasts', initials: 'B', xp: 197, change: '+31 XP' },
    { name: 'Tiny Victories', handle: 'one mission club', initials: 'T', xp: 116, change: '+22 XP' },
  ],
  Campus: [
    { name: 'Nadia', handle: 'north campus', initials: 'N', xp: 591, change: '+92 XP' },
    { name: 'You', handle: 'north campus', initials: 'Y', xp: 284, change: '+75 XP', current: true },
    { name: 'Miko', handle: 'north campus', initials: 'M', xp: 271, change: '+47 XP' },
    { name: 'Rin', handle: 'north campus', initials: 'R', xp: 220, change: '+39 XP' },
    { name: 'Ari', handle: 'north campus', initials: 'A', xp: 182, change: '+21 XP' },
  ],
};

export function getBadges(
  missions: Mission[],
  completedFocusBreaks = 0,
  unlockedBadges: Record<string, string> = {}
): Badge[] {
  const completedCount = missions.filter((m) => m.done).length;
  const limitMission = missions.find((m) => m.id === 'set-scroll-limit') ?? missions[1];
  const checkInMission = missions.find((m) => m.id === 'brain-check-in') ?? missions[2];
  const coreMissions = missions.filter((m) => !m.usageLinked);
  const completedCoreCount = coreMissions.filter((m) => m.done).length;

  const rawBadges: Omit<Badge, 'unlocked' | 'unlockedAt'>[] = [
    {
      id: 'first-flight',
      name: 'First Flight',
      description: 'You made one kind choice for your brain.',
      requirement: 'Complete 1 mission',
      iconName: 'star',
      color: 'pink',
    },
    {
      id: 'limit-setter',
      name: 'Limit Setter',
      description: 'You gave your scrolling a boundary.',
      requirement: 'Set a scroll limit',
      iconName: 'shield-check',
      color: 'green',
    },
    {
      id: 'grass-toucher',
      name: 'Grass Toucher',
      description: 'Certified offline for at least ten minutes.',
      requirement: 'Complete 2 missions',
      iconName: 'leaf',
      color: 'yellow',
    },
    {
      id: 'brain-check',
      name: 'Brain Check',
      description: 'You checked in with the person behind the scroll.',
      requirement: 'Complete the brain check-in',
      iconName: 'brain',
      color: 'blue',
    },
    {
      id: 'soft-launcher',
      name: 'Soft Launcher',
      description: 'Three small resets. One very good day.',
      requirement: 'Complete all daily missions',
      iconName: 'crown',
      color: 'purple',
    },
    {
      id: 'offline-icon',
      name: 'Offline Icon',
      description: 'Your phone missed you. Briefly.',
      requirement: 'Complete a focus break session',
      iconName: 'gem',
      color: 'orange',
    },
  ];

  const conditionMap: Record<string, boolean> = {
    'first-flight': completedCount >= 1,
    'limit-setter': Boolean(limitMission?.done),
    'grass-toucher': completedCount >= 2,
    'brain-check': Boolean(checkInMission?.done),
    'soft-launcher':
      (coreMissions.length > 0 && completedCoreCount >= coreMissions.length) ||
      (missions.length > 0 && completedCount >= missions.length),
    'offline-icon': completedFocusBreaks >= 1,
  };

  return rawBadges.map((b) => {
    const unlockedAt = unlockedBadges[b.id];
    const unlocked = Boolean(unlockedAt) || Boolean(conditionMap[b.id]);
    return {
      ...b,
      unlocked,
      unlockedAt,
    };
  });
}
