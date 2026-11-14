import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistedAppState } from '../constants/types';
import {
  createInitialPersistedState,
  evaluateStreakState,
  getLocalDateKey,
  getXpLedgerEntries,
  syncWeeklyQuestsState,
} from './domainLogic';

export const STORAGE_KEY = '@rot_executive_demo_state_v1';

export async function loadPersistedState(
  dateKey: string = getLocalDateKey()
): Promise<PersistedAppState> {
  const fallback = createInitialPersistedState(dateKey);
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fallback;
    }
    const parsed = JSON.parse(raw) as Partial<PersistedAppState>;
    let merged: PersistedAppState = {
      ...fallback,
      ...parsed,
      schemaVersion: 3,
      profile: {
        ...fallback.profile,
        ...(parsed.profile ?? {}),
      },
      settings: {
        ...fallback.settings,
        ...(parsed.settings ?? {}),
      },
      claimedXpEvents: {
        ...fallback.claimedXpEvents,
        ...(parsed.claimedXpEvents ?? {}),
      },
      missionsByDate: {
        ...fallback.missionsByDate,
        ...(parsed.missionsByDate ?? {}),
      },
      dailyChestByDate: {
        ...fallback.dailyChestByDate,
        ...(parsed.dailyChestByDate ?? {}),
      },
      unlockedBadges: {
        ...fallback.unlockedBadges,
        ...(parsed.unlockedBadges ?? {}),
      },
      streak: {
        ...fallback.streak,
        ...(parsed.streak ?? {}),
        historyByDate: {
          ...fallback.streak.historyByDate,
          ...(parsed.streak?.historyByDate ?? {}),
        },
      },
      weeklyQuestsByWeek: {
        ...fallback.weeklyQuestsByWeek,
        ...(parsed.weeklyQuestsByWeek ?? {}),
      },
      moodLogsByDate: {
        ...fallback.moodLogsByDate,
        ...(parsed.moodLogsByDate ?? {}),
      },
      xpLedger: Array.isArray(parsed.xpLedger) ? parsed.xpLedger : [],
      sentNotificationsByDate: {
        ...fallback.sentNotificationsByDate,
        ...(parsed.sentNotificationsByDate ?? {}),
      },
    };

    // Reconcile XP ledger entries from any v1/v2 claimedXpEvents and evaluate streak & weekly quests
    const fullLedger = getXpLedgerEntries(merged).filter(
      (e) => e.category !== 'baseline'
    );
    merged = {
      ...merged,
      xpLedger: fullLedger,
    };
    merged = evaluateStreakState(merged, dateKey);
    merged = syncWeeklyQuestsState(merged, dateKey);
    return merged;
  } catch {
    return fallback;
  }
}

export async function savePersistedState(state: PersistedAppState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Non-fatal local storage write error
  }
}
