package com.rot.brainrotclub

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import kotlin.math.max
import kotlin.math.min

class UsageStatsModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "RotUsageStats"
        const val INSTAGRAM_PACKAGE = "com.instagram.android"
        private const val MAX_SINGLE_SESSION_MS = 4 * 60 * 60 * 1000L // 4-hour cap against missing stop events
        private const val SESSION_GAP_MERGE_MS = 1500L // Merge sub-1.5s intra-app activity transitions
    }

    private data class DayWindow(
        val dateKey: String,
        val dayLabel: String,
        val startMs: Long,
        val endMs: Long,
        var eventDurationMs: Long = 0L,
        var statsDurationMs: Long = 0L,
        var sessionCount: Int = 0,
        var anyDeviceEvents: Boolean = false
    )

    override fun getName(): String = NAME

    private fun checkUsageAccessGranted(context: Context): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as? AppOpsManager
            ?: return false
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
        }
        if (mode == AppOpsManager.MODE_ALLOWED) {
            return true
        }
        if (mode == AppOpsManager.MODE_DEFAULT) {
            return context.checkCallingOrSelfPermission(android.Manifest.permission.PACKAGE_USAGE_STATS) ==
                PackageManager.PERMISSION_GRANTED
        }
        return false
    }

    private fun checkPackageInstalled(context: Context, packageName: String): Boolean {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.packageManager.getPackageInfo(
                    packageName,
                    PackageManager.PackageInfoFlags.of(0)
                )
            } else {
                @Suppress("DEPRECATION")
                context.packageManager.getPackageInfo(packageName, 0)
            }
            true
        } catch (_: PackageManager.NameNotFoundException) {
            false
        } catch (_: Exception) {
            false
        }
    }

    @ReactMethod
    fun hasUsageAccess(promise: Promise) {
        try {
            promise.resolve(checkUsageAccessGranted(reactApplicationContext))
        } catch (_: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun isInstagramInstalled(promise: Promise) {
        try {
            promise.resolve(checkPackageInstalled(reactApplicationContext, INSTAGRAM_PACKAGE))
        } catch (_: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun openUsageAccessSettings(promise: Promise) {
        try {
            val context = reactApplicationContext
            val specificIntent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
                data = Uri.fromParts("package", context.packageName, null)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            try {
                context.startActivity(specificIntent)
                promise.resolve(true)
                return
            } catch (_: Exception) {
                // Fallback to general Usage Access screen on OEMs that reject package URI data
            }

            val fallbackIntent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(fallbackIntent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("OPEN_SETTINGS_ERROR", "Unable to open Usage Access settings: ${e.message}", e)
        }
    }

    @ReactMethod
    fun getInstagramUsageSummary(daysBack: Int, promise: Promise) {
        try {
            val context = reactApplicationContext
            val now = System.currentTimeMillis()
            val hasPermission = checkUsageAccessGranted(context)
            val instagramInstalled = checkPackageInstalled(context, INSTAGRAM_PACKAGE)

            val result = Arguments.createMap().apply {
                putBoolean("permissionGranted", hasPermission)
                putBoolean("instagramInstalled", instagramInstalled)
                putDouble("queriedAtMs", now.toDouble())
                putString("manufacturer", Build.MANUFACTURER ?: "unknown")
                putString("model", Build.MODEL ?: "unknown")
                putInt("sdkInt", Build.VERSION.SDK_INT)
            }

            if (!hasPermission) {
                result.putString("status", "permission_required")
                result.putString(
                    "statusReason",
                    "Android Usage Access is not granted. Enable Usage Access to read foreground time estimates."
                )
                result.putNull("todayForegroundMs")
                result.putArray("dailyBreakdown", Arguments.createArray())
                promise.resolve(result)
                return
            }

            val usageStatsManager =
                context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
            if (usageStatsManager == null) {
                result.putString("status", "unavailable")
                result.putString("statusReason", "UsageStatsManager service is unavailable on this device.")
                result.putNull("todayForegroundMs")
                result.putArray("dailyBreakdown", Arguments.createArray())
                promise.resolve(result)
                return
            }

            val safeDays = max(1, min(daysBack, 14))
            val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
            val dayLabelFormat = SimpleDateFormat("EEE", Locale.US)

            val cal = Calendar.getInstance()
            cal.timeInMillis = now
            cal.set(Calendar.HOUR_OF_DAY, 0)
            cal.set(Calendar.MINUTE, 0)
            cal.set(Calendar.SECOND, 0)
            cal.set(Calendar.MILLISECOND, 0)
            val todayStartMs = cal.timeInMillis

            cal.add(Calendar.DAY_OF_YEAR, -(safeDays - 1))
            val windowStartMs = cal.timeInMillis

            val dayWindows = mutableListOf<DayWindow>()
            val iterCal = Calendar.getInstance().apply { timeInMillis = windowStartMs }
            for (i in 0 until safeDays) {
                val start = iterCal.timeInMillis
                iterCal.add(Calendar.DAY_OF_YEAR, 1)
                val end = min(iterCal.timeInMillis, now)
                val d = Date(start)
                dayWindows.add(
                    DayWindow(
                        dateKey = dateFormat.format(d),
                        dayLabel = dayLabelFormat.format(d).take(1).uppercase(Locale.US),
                        startMs = start,
                        endMs = end
                    )
                )
            }

            // 1. Parse UsageEvents tracking per-activity foreground state for Instagram
            var totalSystemEventsCount = 0
            var lastEventTimestamp = 0L

            val activeIgClasses = mutableSetOf<String>()
            var currentSessionStart: Long? = null
            var pendingSessionEnd: Long? = null

            val usageEvents = usageStatsManager.queryEvents(windowStartMs, now)
            val event = UsageEvents.Event()

            while (usageEvents != null && usageEvents.hasNextEvent()) {
                usageEvents.getNextEvent(event)
                totalSystemEventsCount++
                if (event.timeStamp > lastEventTimestamp) {
                    lastEventTimestamp = event.timeStamp
                }

                for (dw in dayWindows) {
                    if (event.timeStamp in dw.startMs..dw.endMs) {
                        dw.anyDeviceEvents = true
                        break
                    }
                }

                // Flush any pending session end if time has advanced beyond merge gap
                val pStart = currentSessionStart
                val pEnd = pendingSessionEnd
                if (pStart != null && pEnd != null && activeIgClasses.isEmpty() &&
                    (event.timeStamp - pEnd > SESSION_GAP_MERGE_MS || event.packageName != INSTAGRAM_PACKAGE)
                ) {
                    val cappedEnd = min(pEnd, pStart + MAX_SINGLE_SESSION_MS)
                    distributeIntervalToDays(pStart, cappedEnd, dayWindows)
                    currentSessionStart = null
                    pendingSessionEnd = null
                }

                if (event.packageName == INSTAGRAM_PACKAGE) {
                    val cls = event.className ?: "default"
                    when (event.eventType) {
                        UsageEvents.Event.ACTIVITY_RESUMED -> {
                            activeIgClasses.add(cls)
                            if (currentSessionStart == null) {
                                currentSessionStart = event.timeStamp
                            }
                            pendingSessionEnd = null
                        }
                        UsageEvents.Event.ACTIVITY_PAUSED -> {
                            activeIgClasses.remove(cls)
                            if (activeIgClasses.isEmpty() && currentSessionStart != null) {
                                pendingSessionEnd = event.timeStamp
                            }
                        }
                        UsageEvents.Event.ACTIVITY_STOPPED -> {
                            // Only treat STOP as end if that specific class was still considered active
                            if (activeIgClasses.remove(cls) && activeIgClasses.isEmpty() && currentSessionStart != null) {
                                pendingSessionEnd = event.timeStamp
                            }
                        }
                    }
                } else if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED) {
                    // Another app came to foreground; immediately close any active Instagram session
                    if (currentSessionStart != null) {
                        val endTs = pendingSessionEnd ?: event.timeStamp
                        val cappedEnd = min(endTs, currentSessionStart!! + MAX_SINGLE_SESSION_MS)
                        distributeIntervalToDays(currentSessionStart!!, cappedEnd, dayWindows)
                        activeIgClasses.clear()
                        currentSessionStart = null
                        pendingSessionEnd = null
                    }
                }
            }

            // Close any remaining session at the end of event stream
            if (currentSessionStart != null) {
                val endTs = if (activeIgClasses.isNotEmpty()) now else (pendingSessionEnd ?: now)
                val cappedEnd = min(endTs, currentSessionStart!! + MAX_SINGLE_SESSION_MS)
                distributeIntervalToDays(currentSessionStart!!, cappedEnd, dayWindows)
            }

            // 2. Query aggregate UsageStats buckets as fallback for older days where UsageEvents were pruned
            val statsList = usageStatsManager.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY,
                windowStartMs,
                now
            )
            var anyStatsRecords = false
            if (!statsList.isNullOrEmpty()) {
                anyStatsRecords = true
                for (stat in statsList) {
                    if (stat.packageName == INSTAGRAM_PACKAGE && stat.totalTimeInForeground > 0) {
                        val refTime = if (stat.lastTimeUsed >= windowStartMs) stat.lastTimeUsed else stat.firstTimeStamp
                        for (dw in dayWindows) {
                            if (refTime in dw.startMs..dw.endMs) {
                                // Take max rather than summing duplicate OEM daily buckets
                                if (stat.totalTimeInForeground > dw.statsDurationMs) {
                                    dw.statsDurationMs = stat.totalTimeInForeground
                                }
                                break
                            }
                        }
                    }
                }
            }

            val osHasAnyUsageData = totalSystemEventsCount > 0 || anyStatsRecords
            val todayWindow = dayWindows.last()
            val todayMs = if (todayWindow.eventDurationMs > 0L) {
                todayWindow.eventDurationMs
            } else {
                todayWindow.statsDurationMs
            }
            val todaySource = when {
                todayWindow.eventDurationMs > 0L -> "usage_events"
                todayWindow.statsDurationMs > 0L -> "daily_aggregate"
                todayWindow.anyDeviceEvents -> "usage_events_zero"
                else -> "no_os_records"
            }

            val breakdownArray = Arguments.createArray()
            for (dw in dayWindows) {
                val chosenMs = if (dw.eventDurationMs > 0L) dw.eventDurationMs else dw.statsDurationMs
                val dayMap: WritableMap = Arguments.createMap().apply {
                    putString("date", dw.dateKey)
                    putString("dayLabel", dw.dayLabel)
                    putDouble("foregroundMs", chosenMs.toDouble())
                    putInt("sessionCount", dw.sessionCount)
                    putBoolean("hasOsCoverage", dw.anyDeviceEvents || anyStatsRecords)
                    putString(
                        "source",
                        if (dw.eventDurationMs > 0L) "usage_events" else if (dw.statsDurationMs > 0L) "daily_aggregate" else "zero_or_empty"
                    )
                }
                breakdownArray.pushMap(dayMap)
            }

            result.putArray("dailyBreakdown", breakdownArray)
            result.putInt("totalSystemEventsScanned", totalSystemEventsCount)
            result.putDouble("lastOsEventAtMs", lastEventTimestamp.toDouble())
            result.putDouble("todayStartMs", todayStartMs.toDouble())
            result.putString("aggregationSource", todaySource)

            when {
                !osHasAnyUsageData -> {
                    result.putString("status", "unavailable")
                    result.putString(
                        "statusReason",
                        "Android UsageStats returned no system usage records for this period. The OS may restrict background usage history."
                    )
                    result.putNull("todayForegroundMs")
                }
                !instagramInstalled && todayMs == 0L -> {
                    result.putString("status", "not_installed")
                    result.putString(
                        "statusReason",
                        "Instagram (com.instagram.android) is not installed on this device, and no prior Instagram usage was recorded today."
                    )
                    result.putNull("todayForegroundMs")
                }
                else -> {
                    result.putString("status", "ok")
                    result.putString(
                        "statusReason",
                        "Estimated foreground time calculated from Android UsageStats."
                    )
                    result.putDouble("todayForegroundMs", todayMs.toDouble())
                    result.putInt("todaySessionCount", todayWindow.sessionCount)
                }
            }

            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("USAGE_QUERY_ERROR", "Failed to query UsageStats: ${e.message}", e)
        }
    }

    private fun distributeIntervalToDays(
        intervalStart: Long,
        intervalEnd: Long,
        dayWindows: List<DayWindow>
    ) {
        if (intervalEnd <= intervalStart) return
        for (dw in dayWindows) {
            val clippedStart = max(intervalStart, dw.startMs)
            val clippedEnd = min(intervalEnd, dw.endMs)
            if (clippedEnd > clippedStart) {
                dw.eventDurationMs += (clippedEnd - clippedStart)
                dw.sessionCount += 1
            }
        }
    }
}
