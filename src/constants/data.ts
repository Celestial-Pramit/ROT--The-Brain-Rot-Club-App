import { Mission, Ranking, LeaderboardTab } from './types';

export const initialMissions: Mission[] = [
  {
    title: 'Touch some grass',
    detail: 'Take a 10 minute offline reset',
    reward: 40,
    iconName: 'leaf',
    iconColor: '#572b92',
    iconBg: '#eee7fa',
    done: false,
  },
  {
    title: 'Set a scroll limit',
    detail: 'Choose a kinder target for today',
    reward: 35,
    iconName: 'clock',
    iconColor: '#ce6d24',
    iconBg: '#fff1d8',
    done: true,
  },
  {
    title: 'Do the brain check-in',
    detail: 'Name one thing you want to make time for',
    reward: 25,
    iconName: 'brain',
    iconColor: '#f32c87',
    iconBg: '#ffe4ef',
    done: false,
  },
];

export const dailyItems = [
  'Soft Reset sticker',
  'Golden brain pin',
  'Offline icon',
  'Tiny victory badge',
];

export const rankings: Record<LeaderboardTab, Ranking[]> = {
  Friends: [
    { name: 'Nadia', handle: 'nightshift.nadia', initials: 'N', xp: 391, change: '+42 XP' },
    { name: 'You', handle: 'rafi.resets', initials: 'R', xp: 284, change: '+75 XP', current: true },
    { name: 'Rafi', handle: 'rafi.scrolls', initials: 'R', xp: 242, change: '+28 XP' },
    { name: 'Mina', handle: 'minamakes', initials: 'M', xp: 198, change: '+19 XP' },
    { name: 'Jules', handle: 'julesoffline', initials: 'J', xp: 154, change: '+12 XP' },
  ],
  Squad: [
    { name: 'Team Grass', handle: 'the offline club', initials: 'T', xp: 1180, change: '+240 XP' },
    { name: 'You', handle: 'rafi.resets', initials: 'R', xp: 284, change: '+75 XP', current: true },
    { name: 'Slow Scrolls', handle: 'the gentle gang', initials: 'S', xp: 240, change: '+64 XP' },
    { name: 'The Break Room', handle: 'pause enthusiasts', initials: 'B', xp: 197, change: '+31 XP' },
    { name: 'Tiny Victories', handle: 'one mission club', initials: 'T', xp: 116, change: '+22 XP' },
  ],
  Campus: [
    { name: 'Nadia', handle: 'north campus', initials: 'N', xp: 591, change: '+92 XP' },
    { name: 'You', handle: 'north campus', initials: 'R', xp: 284, change: '+75 XP', current: true },
    { name: 'Miko', handle: 'north campus', initials: 'M', xp: 271, change: '+47 XP' },
    { name: 'Rin', handle: 'north campus', initials: 'R', xp: 220, change: '+39 XP' },
    { name: 'Ari', handle: 'north campus', initials: 'A', xp: 182, change: '+21 XP' },
  ],
};

export function getBadges(missions: Mission[]) {
  const completedCount = missions.filter((m) => m.done).length;
  return [
    {
      name: 'First Flight',
      description: 'You made one kind choice for your brain.',
      requirement: 'Complete 1 mission',
      iconName: 'star',
      color: 'pink',
      unlocked: completedCount >= 1,
    },
    {
      name: 'Limit Setter',
      description: 'You gave your scrolling a boundary.',
      requirement: 'Set a scroll limit',
      iconName: 'shield-check',
      color: 'green',
      unlocked: missions[1]?.done ?? false,
    },
    {
      name: 'Grass Toucher',
      description: 'Certified offline for at least ten minutes.',
      requirement: 'Complete 2 missions',
      iconName: 'leaf',
      color: 'yellow',
      unlocked: completedCount >= 2,
    },
    {
      name: 'Brain Check',
      description: 'You checked in with the person behind the scroll.',
      requirement: 'Complete the brain check-in',
      iconName: 'brain',
      color: 'blue',
      unlocked: missions[2]?.done ?? false,
    },
    {
      name: 'Soft Launcher',
      description: 'Three small resets. One very good day.',
      requirement: 'Complete all daily missions',
      iconName: 'crown',
      color: 'purple',
      unlocked: completedCount >= missions.length,
    },
    {
      name: 'Offline Icon',
      description: 'Your phone missed you. Briefly.',
      requirement: 'Complete 5 focus breaks',
      iconName: 'gem',
      color: 'orange',
      unlocked: false,
    },
  ];
}
