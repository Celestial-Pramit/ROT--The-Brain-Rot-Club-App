package com.rot.brainrotclub

import android.content.Context
import androidx.work.Worker
import androidx.work.WorkerParameters

class RotUsageCheckWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : Worker(appContext, workerParams) {

    override fun doWork(): Result {
        return try {
            RotNotificationHelper.evaluateUsageInBackground(applicationContext)
            Result.success()
        } catch (_: Exception) {
            Result.retry()
        }
    }
}
