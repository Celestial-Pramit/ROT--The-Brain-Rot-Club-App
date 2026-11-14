import { NativeModules, Platform } from 'react-native';
import { InstagramUsageSummary } from '../constants/types';

type RotUsageStatsNativeModule = {
  hasUsageAccess(): Promise<boolean>;
  isInstagramInstalled(): Promise<boolean>;
  openUsageAccessSettings(): Promise<boolean>;
  getInstagramUsageSummary(daysBack: number): Promise<InstagramUsageSummary>;
};

const NativeRotUsageStats: RotUsageStatsNativeModule | undefined =
  Platform.OS === 'android' ? NativeModules.RotUsageStats : undefined;

export async function checkHasUsageAccess(): Promise<boolean> {
  if (!NativeRotUsageStats) return false;
  try {
    return await NativeRotUsageStats.hasUsageAccess();
  } catch {
    return false;
  }
}

export async function checkIsInstagramInstalled(): Promise<boolean> {
  if (!NativeRotUsageStats) return false;
  try {
    return await NativeRotUsageStats.isInstagramInstalled();
  } catch {
    return false;
  }
}

export async function openAndroidUsageAccessSettings(): Promise<boolean> {
  if (!NativeRotUsageStats) return false;
  try {
    return await NativeRotUsageStats.openUsageAccessSettings();
  } catch {
    return false;
  }
}

export async function queryInstagramUsageSummary(
  daysBack = 7
): Promise<InstagramUsageSummary> {
  const now = Date.now();
  if (Platform.OS !== 'android' || !NativeRotUsageStats) {
    return {
      status: 'unavailable',
      statusReason:
        'Android UsageStats native module is only available in the Android development build.',
      permissionGranted: false,
      instagramInstalled: false,
      todayForegroundMs: null,
      queriedAtMs: now,
      dailyBreakdown: [],
    };
  }

  try {
    const raw = await NativeRotUsageStats.getInstagramUsageSummary(daysBack);
    return {
      status: raw.status ?? 'unavailable',
      statusReason: raw.statusReason ?? '',
      permissionGranted: Boolean(raw.permissionGranted),
      instagramInstalled: Boolean(raw.instagramInstalled),
      todayForegroundMs:
        typeof raw.todayForegroundMs === 'number' ? raw.todayForegroundMs : null,
      todaySessionCount: raw.todaySessionCount ?? 0,
      queriedAtMs: typeof raw.queriedAtMs === 'number' ? raw.queriedAtMs : now,
      dailyBreakdown: Array.isArray(raw.dailyBreakdown) ? raw.dailyBreakdown : [],
      aggregationSource: raw.aggregationSource,
      manufacturer: raw.manufacturer,
      model: raw.model,
      sdkInt: raw.sdkInt,
    };
  } catch (err: any) {
    return {
      status: 'unavailable',
      statusReason: err?.message || 'Unable to query Android UsageStats.',
      permissionGranted: false,
      instagramInstalled: false,
      todayForegroundMs: null,
      queriedAtMs: now,
      dailyBreakdown: [],
    };
  }
}
