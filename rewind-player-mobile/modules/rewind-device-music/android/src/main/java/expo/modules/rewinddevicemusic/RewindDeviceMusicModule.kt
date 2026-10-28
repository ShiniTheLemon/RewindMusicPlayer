package expo.modules.rewinddevicemusic

import android.Manifest
import android.content.ContentResolver
import android.content.ContentUris
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import expo.modules.interfaces.permissions.PermissionsStatus
import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Device music enumeration over MediaStore. Returns playable `content://`
 * URIs — ExoPlayer plays them directly, so nothing is copied.
 *
 * Permissions: READ_MEDIA_AUDIO on API 33+, READ_EXTERNAL_STORAGE on 29–32,
 * none needed below 29. The manifest entries are added by the module's
 * config plugin (app.plugin.js).
 */
class RewindDeviceMusicModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("RewindDeviceMusic")

    AsyncFunction("getPermissionsAsync") {
      val permissions = appContext.permissions
      permissions != null && permissions.hasGrantedPermissions(*requiredPermissions())
    }

    AsyncFunction("requestPermissionsAsync") { promise: Promise ->
      val permissions = appContext.permissions
      if (permissions == null) {
        promise.resolve(false)
        return@AsyncFunction
      }
      permissions.askForPermissions({ response ->
        promise.resolve(
          requiredPermissions().all { p -> response[p]?.status == PermissionsStatus.GRANTED },
        )
      }, *requiredPermissions())
    }

    AsyncFunction("listTracks") Coroutine { offset: Int, limit: Int ->
      withContext(Dispatchers.IO) {
        queryTracks(offset, limit)
      }
    }
  }

  private fun requiredPermissions(): Array<String> {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      arrayOf(Manifest.permission.READ_MEDIA_AUDIO)
    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE)
    } else {
      arrayOf()
    }
  }

  private fun queryTracks(offset: Int, limit: Int): Map<String, Any?> {
    val context = appContext.reactContext ?: return emptyPage()
    val collection = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL)
    } else {
      MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
    }
    val selection = "${MediaStore.Audio.Media.IS_MUSIC} != 0"
    val safeLimit = limit.coerceIn(1, 200)

    val projection = arrayOf(
      MediaStore.Audio.Media._ID,
      MediaStore.Audio.Media.TITLE,
      MediaStore.Audio.Media.ARTIST,
      MediaStore.Audio.Media.ALBUM,
      MediaStore.Audio.Media.ALBUM_ID,
      MediaStore.Audio.Media.DURATION,
    )

    // Fetch limit + 1 rows so `hasMore` doesn't need a second query.
    // Bundle-based limit/offset (API 26+) — a LIMIT clause in sortOrder
    // throws on some OEM providers.
    val supportsQueryArgs = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
    val rows = if (supportsQueryArgs) {
      val queryArgs = Bundle().apply {
        putInt(ContentResolver.QUERY_ARG_LIMIT, safeLimit + 1)
        putInt(ContentResolver.QUERY_ARG_OFFSET, offset)
      }
      context.contentResolver.query(collection, projection, queryArgs, null)
    } else {
      context.contentResolver.query(
        collection,
        projection,
        selection,
        null,
        "${MediaStore.Audio.Media.DATE_ADDED} DESC",
      )
    } ?: return emptyPage()

    rows.use { cursor ->
      val idCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID)
      val titleCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE)
      val artistCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST)
      val albumCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM)
      val albumIdCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM_ID)
      val durationCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION)

      val albumIds = mutableSetOf<Long>()
      val tracks = mutableListOf<MutableMap<String, Any?>>()

      fun readRow(): MutableMap<String, Any?> {
        val id = cursor.getLong(idCol)
        val albumId = cursor.getLong(albumIdCol)
        albumIds.add(albumId)
        return mutableMapOf(
          "id" to "media:$id",
          "title" to (cursor.getString(titleCol) ?: ""),
          "artist" to (cursor.getString(artistCol) ?: ""),
          "album" to (cursor.getString(albumCol) ?: ""),
          "durationMs" to cursor.getLong(durationCol),
          "uri" to ContentUris.withAppendedId(collection, id).toString(),
          "artworkUri" to null,
          "drmProtected" to false,
          "_albumId" to albumId,
        )
      }

      val hasMore: Boolean
      if (supportsQueryArgs) {
        hasMore = cursor.count > safeLimit
        while (cursor.moveToNext() && tracks.size < safeLimit) {
          tracks.add(readRow())
        }
      } else {
        // No limit support: skip to the offset, keep safeLimit + 1 rows.
        var index = 0
        while (cursor.moveToNext()) {
          if (index < offset) {
            index++
            continue
          }
          if (tracks.size >= safeLimit + 1) break
          tracks.add(readRow())
        }
        hasMore = tracks.size > safeLimit
      }

      val artworkByAlbum = loadAlbumArt(context, albumIds)
      val result = tracks.take(safeLimit).map { t ->
        val albumId = t.remove("_albumId") as Long
        t["artworkUri"] = artworkByAlbum[albumId]
        t
      }

      return mapOf(
        "tracks" to result,
        "total" to countTracks(context, collection, selection),
        "hasMore" to hasMore,
      )
    }
  }

  private fun countTracks(
    context: android.content.Context,
    collection: android.net.Uri,
    selection: String,
  ): Int {
    return try {
      context.contentResolver.query(
        collection,
        arrayOf("COUNT(*)"),
        selection,
        null,
        null,
      )?.use { c -> if (c.moveToFirst()) c.getInt(0) else 0 } ?: 0
    } catch (_: Exception) {
      0
    }
  }

  /**
   * Batch-resolves album art for the page. ALBUM_ART is a plain file path,
   * readable with the audio permission on most devices; failures degrade to
   * null and the UI falls back to the static cover.
   */
  private fun loadAlbumArt(
    context: android.content.Context,
    albumIds: Set<Long>,
  ): Map<Long, String?> {
    if (albumIds.isEmpty()) return emptyMap()
    val result = mutableMapOf<Long, String?>()
    try {
      val projection = arrayOf(
        MediaStore.Audio.Albums._ID,
        MediaStore.Audio.Albums.ALBUM_ART,
      )
      context.contentResolver.query(
        MediaStore.Audio.Albums.EXTERNAL_CONTENT_URI,
        projection,
        "${MediaStore.Audio.Albums._ID} IN (${albumIds.joinToString(",")})",
        null,
        null,
      )?.use { c ->
        val idCol = c.getColumnIndexOrThrow(MediaStore.Audio.Albums._ID)
        val artCol = c.getColumnIndexOrThrow(MediaStore.Audio.Albums.ALBUM_ART)
        while (c.moveToNext()) {
          val path = c.getString(artCol)
          result[c.getLong(idCol)] = if (path.isNullOrEmpty()) null else "file://$path"
        }
      }
    } catch (_: Exception) {
      // No artwork — fall back to the static cover on the JS side.
    }
    return result
  }

  private fun emptyPage(): Map<String, Any?> {
    return mapOf("tracks" to emptyList<Map<String, Any?>>(), "total" to 0, "hasMore" to false)
  }
}
