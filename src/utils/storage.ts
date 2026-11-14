import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistedAppState } from '../constants/types';
import { createInitialPersistedState, getLocalDateKey } from './domainLogic';

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
    const merged: PersistedAppState = {
      ...fallback,
      ...parsed,
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
    };
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
