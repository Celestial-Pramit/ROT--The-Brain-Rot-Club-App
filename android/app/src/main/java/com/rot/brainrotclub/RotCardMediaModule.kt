package com.rot.brainrotclub

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.ContentUris
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream

class RotCardMediaModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "RotCardMedia"
        private const val SHARE_REQUEST_CODE = 5209
        private const val PREFS_NAME = "rot_card_media_prefs"
        private const val CREAM_BG_COLOR = "#FFF9EA"
    }

    private var pendingSharePromise: Promise? = null

    private val activityEventListener = object : BaseActivityEventListener() {
        override fun onActivityResult(
            activity: Activity,
            requestCode: Int,
            resultCode: Int,
            data: Intent?
        ) {
            if (requestCode == SHARE_REQUEST_CODE) {
                val promise = pendingSharePromise
                pendingSharePromise = null
                if (promise != null) {
                    val map = Arguments.createMap().apply {
                        putString("status", if (resultCode == Activity.RESULT_OK) "shared" else "closed")
                    }
                    promise.resolve(map)
                }
            }
        }
    }

    init {
        reactContext.addActivityEventListener(activityEventListener)
    }

    override fun getName(): String = NAME

    private fun sanitizeFilename(raw: String): String {
        val cleaned = raw.trim().replace(Regex("[^A-Za-z0-9._-]"), "_")
        val withExt = if (cleaned.lowercase().endsWith(".png")) cleaned else "$cleaned.png"
        return if (withExt.length > 96) withExt.take(92) + ".png" else withExt
    }

    private fun resolveSourceFile(sourceUri: String): File {
        val cleaned = if (sourceUri.startsWith("file://")) {
            Uri.parse(sourceUri).path ?: sourceUri.removePrefix("file://")
        } else {
            sourceUri
        }
        return File(cleaned)
    }

    private fun getCardCacheDir(context: Context): File {
        val dir = File(context.cacheDir, "rot-cards")
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    @ReactMethod
    fun prepareAndVerifyCardPng(
        sourceUri: String,
        targetWidth: Int,
        targetHeight: Int,
        filename: String,
        promise: Promise
    ) {
        try {
            val srcFile = resolveSourceFile(sourceUri)
            if (!srcFile.exists() || srcFile.length() == 0L) {
                promise.reject("SOURCE_MISSING", "Captured card image file was not found.")
                return
            }

            val safeW = targetWidth.coerceIn(360, 2160)
            val safeH = targetHeight.coerceIn(360, 3840)
            val decoded = BitmapFactory.decodeFile(srcFile.absolutePath)
            if (decoded == null) {
                promise.reject("DECODE_FAILED", "Could not decode captured card PNG.")
                return
            }

            val outBitmap = Bitmap.createBitmap(safeW, safeH, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(outBitmap)
            canvas.drawColor(Color.parseColor(CREAM_BG_COLOR))

            val paint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG or Paint.DITHER_FLAG)
            val srcRect = Rect(0, 0, decoded.width, decoded.height)
            val dstRect = Rect(0, 0, safeW, safeH)
            canvas.drawBitmap(decoded, srcRect, dstRect, paint)
            decoded.recycle()

            val safeName = sanitizeFilename(filename)
            val outFile = File(getCardCacheDir(reactApplicationContext), safeName)
            FileOutputStream(outFile).use { fos ->
                outBitmap.compress(Bitmap.CompressFormat.PNG, 100, fos)
                fos.flush()
            }
            outBitmap.recycle()

            val opts = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            BitmapFactory.decodeFile(outFile.absolutePath, opts)

            val result = Arguments.createMap().apply {
                putString("filePath", outFile.absolutePath)
                putString("filename", safeName)
                putInt("width", opts.outWidth)
                putInt("height", opts.outHeight)
                putDouble("byteSize", outFile.length().toDouble())
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("PREPARE_PNG_ERROR", "Failed to prepare PNG: ${e.message}", e)
        }
    }

    private fun checkContentUriExists(context: Context, uriString: String): Boolean {
        return try {
            val uri = Uri.parse(uriString)
            context.contentResolver.query(
                uri,
                arrayOf(MediaStore.Images.Media._ID),
                null,
                null,
                null
            )?.use { cursor ->
                cursor.moveToFirst()
            } ?: false
        } catch (_: Exception) {
            false
        }
    }

    private fun findExistingGalleryUriByName(context: Context, filename: String): Uri? {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return null
        return try {
            val projection = arrayOf(
                MediaStore.Images.Media._ID,
                MediaStore.Images.Media.DISPLAY_NAME
            )
            val selection =
                "${MediaStore.Images.Media.DISPLAY_NAME} = ? AND ${MediaStore.Images.Media.RELATIVE_PATH} LIKE ?"
            val args = arrayOf(filename, "%Pictures/ROT%")
            context.contentResolver.query(
                MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                projection,
                selection,
                args,
                "${MediaStore.Images.Media.DATE_ADDED} DESC"
            )?.use { cursor ->
                if (cursor.moveToFirst()) {
                    val idCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media._ID)
                    val id = cursor.getLong(idCol)
                    ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, id)
                } else {
                    null
                }
            }
        } catch (_: Exception) {
            null
        }
    }

    @ReactMethod
    fun saveCardToGallery(
        filePath: String,
        filename: String,
        dedupKey: String,
        promise: Promise
    ) {
        try {
            val context = reactApplicationContext
            val srcFile = resolveSourceFile(filePath)
            if (!srcFile.exists() || srcFile.length() == 0L) {
                promise.reject("FILE_NOT_FOUND", "Generated card PNG file was not found.")
                return
            }

            val safeName = sanitizeFilename(filename)
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            if (dedupKey.isNotEmpty()) {
                val cachedUri = prefs.getString("saved_uri_$dedupKey", null)
                if (!cachedUri.isNullOrEmpty() && checkContentUriExists(context, cachedUri)) {
                    val result = Arguments.createMap().apply {
                        putString("status", "already_saved")
                        putString("contentUri", cachedUri)
                        putString("filename", safeName)
                        putString("album", "Pictures/ROT")
                    }
                    promise.resolve(result)
                    return
                }
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val existingUri = findExistingGalleryUriByName(context, safeName)
                if (existingUri != null) {
                    if (dedupKey.isNotEmpty()) {
                        prefs.edit().putString("saved_uri_$dedupKey", existingUri.toString()).apply()
                    }
                    val result = Arguments.createMap().apply {
                        putString("status", "already_saved")
                        putString("contentUri", existingUri.toString())
                        putString("filename", safeName)
                        putString("album", "Pictures/ROT")
                    }
                    promise.resolve(result)
                    return
                }

                val values = ContentValues().apply {
                    put(MediaStore.Images.Media.DISPLAY_NAME, safeName)
                    put(MediaStore.Images.Media.MIME_TYPE, "image/png")
                    put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/ROT")
                    put(MediaStore.Images.Media.IS_PENDING, 1)
                }

                val resolver = context.contentResolver
                val uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
                if (uri == null) {
                    promise.reject("MEDIASTORE_INSERT_FAILED", "Could not create gallery entry in Pictures/ROT.")
                    return
                }

                resolver.openOutputStream(uri)?.use { out ->
                    FileInputStream(srcFile).use { input ->
                        input.copyTo(out)
                    }
                    out.flush()
                } ?: run {
                    resolver.delete(uri, null, null)
                    promise.reject("MEDIASTORE_STREAM_FAILED", "Could not write PNG bytes to Gallery.")
                    return
                }

                val publishValues = ContentValues().apply {
                    put(MediaStore.Images.Media.IS_PENDING, 0)
                }
                resolver.update(uri, publishValues, null, null)

                if (dedupKey.isNotEmpty()) {
                    prefs.edit().putString("saved_uri_$dedupKey", uri.toString()).apply()
                }

                val result = Arguments.createMap().apply {
                    putString("status", "saved")
                    putString("contentUri", uri.toString())
                    putString("filename", safeName)
                    putString("album", "Pictures/ROT")
                }
                promise.resolve(result)
                return
            }

            // Legacy Android <= 9 (API <= 28)
            val writeGranted = ContextCompat.checkSelfPermission(
                context,
                android.Manifest.permission.WRITE_EXTERNAL_STORAGE
            ) == PackageManager.PERMISSION_GRANTED
            if (!writeGranted) {
                promise.reject("STORAGE_PERMISSION_DENIED", "Storage permission is required on Android 9 and below.")
                return
            }

            @Suppress("DEPRECATION")
            val picturesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES)
            val rotAlbumDir = File(picturesDir, "ROT")
            if (!rotAlbumDir.exists()) rotAlbumDir.mkdirs()
            val destFile = File(rotAlbumDir, safeName)
            if (destFile.exists() && destFile.length() > 0L) {
                val result = Arguments.createMap().apply {
                    putString("status", "already_saved")
                    putString("contentUri", Uri.fromFile(destFile).toString())
                    putString("filename", safeName)
                    putString("album", "Pictures/ROT")
                }
                promise.resolve(result)
                return
            }

            FileInputStream(srcFile).use { input ->
                FileOutputStream(destFile).use { out ->
                    input.copyTo(out)
                }
            }
            MediaScannerConnection.scanFile(
                context,
                arrayOf(destFile.absolutePath),
                arrayOf("image/png"),
                null
            )

            val result = Arguments.createMap().apply {
                putString("status", "saved")
                putString("contentUri", Uri.fromFile(destFile).toString())
                putString("filename", safeName)
                putString("album", "Pictures/ROT")
            }
            promise.resolve(result)
        } catch (e: SecurityException) {
            promise.reject("STORAGE_PERMISSION_DENIED", "Gallery write permission denied: ${e.message}", e)
        } catch (e: Exception) {
            promise.reject("GALLERY_SAVE_ERROR", "Failed to save PNG to Gallery: ${e.message}", e)
        }
    }

    @ReactMethod
    fun shareCardPng(
        filePath: String,
        filename: String,
        shareText: String,
        includeMetadata: Boolean,
        promise: Promise
    ) {
        try {
            val context = reactApplicationContext
            val srcFile = resolveSourceFile(filePath)
            if (!srcFile.exists() || srcFile.length() == 0L) {
                promise.reject("FILE_NOT_FOUND", "Card PNG file was not found for sharing.")
                return
            }

            val safeName = sanitizeFilename(filename)
            val shareFile = File(getCardCacheDir(context), safeName)
            if (srcFile.absolutePath != shareFile.absolutePath) {
                FileInputStream(srcFile).use { input ->
                    FileOutputStream(shareFile).use { out ->
                        input.copyTo(out)
                    }
                }
            }

            val contentUri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                shareFile
            )

            val sendIntent = Intent(Intent.ACTION_SEND).apply {
                type = "image/png"
                putExtra(Intent.EXTRA_STREAM, contentUri)
                clipData = ClipData.newUri(context.contentResolver, safeName, contentUri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                if (includeMetadata && shareText.isNotBlank()) {
                    putExtra(Intent.EXTRA_TEXT, shareText)
                    putExtra(Intent.EXTRA_SUBJECT, "ROT. Brainrot Club Card")
                }
            }

            val chooser = Intent.createChooser(sendIntent, "Share ROT Card").apply {
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            val resolved = sendIntent.resolveActivity(context.packageManager)
            if (resolved == null) {
                val map = Arguments.createMap().apply {
                    putString("status", "no_app")
                    putString("contentUri", contentUri.toString())
                }
                promise.resolve(map)
                return
            }

            val activity = reactApplicationContext.currentActivity
            if (activity != null) {
                pendingSharePromise?.let { prev ->
                    prev.resolve(Arguments.createMap().apply { putString("status", "superseded") })
                }
                pendingSharePromise = promise
                activity.startActivityForResult(chooser, SHARE_REQUEST_CODE)
            } else {
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(chooser)
                val map = Arguments.createMap().apply {
                    putString("status", "opened")
                    putString("contentUri", contentUri.toString())
                }
                promise.resolve(map)
            }
        } catch (_: ActivityNotFoundException) {
            pendingSharePromise = null
            val map = Arguments.createMap().apply {
                putString("status", "no_app")
            }
            promise.resolve(map)
        } catch (e: Exception) {
            pendingSharePromise = null
            promise.reject("SHARE_ERROR", "Unable to open Android Share sheet: ${e.message}", e)
        }
    }
}
