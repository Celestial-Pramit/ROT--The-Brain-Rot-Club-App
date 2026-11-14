package com.rot.brainrotclub

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class RotAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        when (action) {
            RotNotificationScheduler.ACTION_EVENING_REMINDER -> {
                RotNotificationHelper.evaluateScheduledReminder(context, "evening")
                RotNotificationScheduler.scheduleDailyAlarms(context)
            }
            RotNotificationScheduler.ACTION_STREAK_REMINDER -> {
                RotNotificationHelper.evaluateScheduledReminder(context, "streak")
                RotNotificationScheduler.scheduleDailyAlarms(context)
            }
        }
    }
}

class RotBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == Intent.ACTION_MY_PACKAGE_REPLACED ||
            action == Intent.ACTION_TIME_CHANGED ||
            action == Intent.ACTION_TIMEZONE_CHANGED
        ) {
            RotNotificationHelper.ensureChannels(context)
            RotNotificationScheduler.rescheduleAll(context)
        }
    }
}
