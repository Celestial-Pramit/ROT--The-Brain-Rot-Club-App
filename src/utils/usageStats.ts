import { NativeModules, Platform } from 'react-native';
import { InstagramUsageSummary } from '../constants/types';

export type DeviceProfileInfo = {
  deviceName: string;
  manufacturer: string;
  model: string;
  sdkInt: number;
};

type RotUsageStatsNativeModule = {
  hasUsageAccess(): Promise<boolean>;
  isInstagramInstalled(): Promise<boolean>;
  openUsageAccessSettings(): Promise<boolean>;
  getDeviceProfileInfo(): Promise<DeviceProfileInfo>;
  getInstagramUsageSummary(daysBack: number): Promise<InstagramUsageSummary>;
};

const NativeRotUsageStats: RotUsageStatsNativeModule | undefined =
  Platform.OS === 'android' ? NativeModules.RotUsageStats : undefined;

const QUERY_TIMEOUT_MS = 6000;

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

export async function queryDeviceProfileInfo(): Promise<DeviceProfileInfo> {
  if (Platform.OS !== 'android' || !NativeRotUsageStats?.getDeviceProfileInfo) {
    return {
      deviceName: 'ROT User',
      manufacturer: 'unknown',
      model: 'unknown',
      sdkInt: 0,
    };
  }
  try {
    const raw = await NativeRotUsageStats.getDeviceProfileInfo();
    return {
      deviceName:
        typeof raw?.deviceName === 'string' && raw.deviceName.trim().length > 0
          ? raw.deviceName.trim()
          : 'ROT User',
      manufacturer: raw?.manufacturer ?? 'unknown',
      model: raw?.model ?? 'unknown',
      sdkInt: typeof raw?.sdkInt === 'number' ? raw.sdkInt : 0,
    };
  } catch {
    return {
      deviceName: 'ROT User',
      manufacturer: 'unknown',
      model: 'unknown',
      sdkInt: 0,
    };
  }
}

export async function queryInstagramUsageSummary(
  daysBack = 7
): Promise<InstagramUsageSummary> {
  const now = Date.now();
  if (Platform.OS !== 'android' || !NativeRotUsageStats) {
    return {
      status: 'query_failed',
      statusReason:
        "We couldn't retrieve your usage data. Your previous saved data hasn't been deleted.",
      permissionGranted: false,
      instagramInstalled: false,
      todayForegroundMs: null,
      queriedAtMs: now,
      dailyBreakdown: [],
      isComplete: false,
      errorCode: 'NATIVE_MODULE_UNAVAILABLE',
    };
  }

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        const err = new Error('UsageStats query timed out');
        (err as any).code = 'QUERY_TIMEOUT';
        reject(err);
      }, QUERY_TIMEOUT_MS);
    });

    const raw = await Promise.race([
      NativeRotUsageStats.getInstagramUsageSummary(daysBack),
      timeoutPromise,
    ]);

    return {
      status: raw.status ?? 'query_failed',
      statusReason: raw.statusReason ?? '',
      permissionGranted: Boolean(raw.permissionGranted),
      instagramInstalled: Boolean(raw.instagramInstalled),
      todayForegroundMs:
        typeof raw.todayForegroundMs === 'number' ? raw.todayForegroundMs : null,
      todaySessionCount: raw.todaySessionCount ?? 0,
      queriedAtMs: typeof raw.queriedAtMs === 'number' ? raw.queriedAtMs : now,
      dailyBreakdown: Array.isArray(raw.dailyBreakdown) ? raw.dailyBreakdown : [],
      aggregationSource: raw.aggregationSource,
      isComplete:
        typeof raw.isComplete === 'boolean' ? raw.isComplete : 'unknown',
      errorCode: raw.errorCode,
      deviceName: raw.deviceName,
      manufacturer: raw.manufacturer,
      model: raw.model,
      sdkInt: raw.sdkInt,
    };
  } catch (err: any) {
    return {
      status: 'query_failed',
      statusReason:
        "We couldn't retrieve your usage data. Your previous saved data hasn't been deleted.",
      permissionGranted: true,
      instagramInstalled: true,
      todayForegroundMs: null,
      queriedAtMs: now,
      dailyBreakdown: [],
      isComplete: false,
      errorCode: err?.code || 'USAGE_QUERY_ERROR',
    };
  }
}
