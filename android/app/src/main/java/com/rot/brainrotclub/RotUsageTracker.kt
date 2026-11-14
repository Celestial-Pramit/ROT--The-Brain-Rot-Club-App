package com.rot.brainrotclub

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Process
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import kotlin.math.max
import kotlin.math.min

object RotUsageTracker {
    const val INSTAGRAM_PACKAGE = "com.instagram.android"
    private const val MAX_SINGLE_SESSION_MS = 4 * 60 * 60 * 1000L
    private const val SESSION_GAP_MERGE_MS = 1500L

    data class DayWindow(
        val dateKey: String,
        val dayLabel: String,
        val startMs: Long,
        val endMs: Long,
        var eventDurationMs: Long = 0L,
        var statsDurationMs: Long = 0L,
        var sessionCount: Int = 0,
        var anyDeviceEvents: Boolean = false
    )

    data class UsageSnapshot(
        val hasPermission: Boolean,
        val instagramInstalled: Boolean,
        val totalSystemEventsCount: Int,
        val anyStatsRecords: Boolean,
        val lastEventTimestamp: Long,
        val todayStartMs: Long,
        val dayWindows: List<DayWindow>
    ) {
        val todayWindow: DayWindow get() = dayWindows.last()
        val todayMs: Long
            get() = if (todayWindow.eventDurationMs > 0L) todayWindow.eventDurationMs else todayWindow.statsDurationMs
        val hasVerifiedTodayEstimate: Boolean
            get() = hasPermission &&
                (todayWindow.anyDeviceEvents || todayWindow.eventDurationMs > 0L || (instagramInstalled && todayWindow.statsDurationMs > 0L))
    }

    fun checkUsageAccessGranted(context: Context): Boolean {
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

    fun checkPackageInstalled(context: Context, packageName: String): Boolean {
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

    fun queryInstagramUsage(context: Context, daysBack: Int = 7, now: Long = System.currentTimeMillis()): UsageSnapshot? {
        val hasPermission = checkUsageAccessGranted(context)
        val instagramInstalled = checkPackageInstalled(context, INSTAGRAM_PACKAGE)
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

        if (!hasPermission) {
            return UsageSnapshot(
                hasPermission = false,
                instagramInstalled = instagramInstalled,
                totalSystemEventsCount = 0,
                anyStatsRecords = false,
                lastEventTimestamp = 0L,
                todayStartMs = todayStartMs,
                dayWindows = dayWindows
            )
        }

        val usageStatsManager =
            context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
                ?: return null

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
                        if (activeIgClasses.remove(cls) && activeIgClasses.isEmpty() && currentSessionStart != null) {
                            pendingSessionEnd = event.timeStamp
                        }
                    }
                }
            } else if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED) {
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

        if (currentSessionStart != null) {
            val endTs = if (activeIgClasses.isNotEmpty()) now else (pendingSessionEnd ?: now)
            val cappedEnd = min(endTs, currentSessionStart!! + MAX_SINGLE_SESSION_MS)
            distributeIntervalToDays(currentSessionStart!!, cappedEnd, dayWindows)
        }

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
                            if (stat.totalTimeInForeground > dw.statsDurationMs) {
                                dw.statsDurationMs = stat.totalTimeInForeground
                            }
                            break
                        }
                    }
                }
            }
        }

        return UsageSnapshot(
            hasPermission = true,
            instagramInstalled = instagramInstalled,
            totalSystemEventsCount = totalSystemEventsCount,
            anyStatsRecords = anyStatsRecords,
            lastEventTimestamp = lastEventTimestamp,
            todayStartMs = todayStartMs,
            dayWindows = dayWindows
        )
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
