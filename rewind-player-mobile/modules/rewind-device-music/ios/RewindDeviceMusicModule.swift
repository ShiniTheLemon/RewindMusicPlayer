import ExpoModulesCore
import MediaPlayer

/**
 * Device music enumeration over MPMediaQuery. Returns `ipod-library://`
 * asset URLs — AVPlayer plays non-DRM items directly, so nothing is copied.
 *
 * Apple Music / DRM items have no asset URL and are reported with
 * `drmProtected = true`; the UI renders them as unplayable.
 *
 * NSAppleMusicUsageDescription is added by the module's config plugin
 * (app.plugin.js).
 */
public class RewindDeviceMusicModule: Module {
  public func definition() -> ModuleDefinition {
    Name("RewindDeviceMusic")

    AsyncFunction("getPermissionsAsync") {
      MPMediaLibrary.authorizationStatus() == .authorized
    }

    AsyncFunction("requestPermissionsAsync") { (promise: Promise) in
      MPMediaLibrary.requestAuthorization { status in
        promise.resolve(status == .authorized)
      }
    }

    AsyncFunction("listTracks") { (offset: Int, limit: Int) -> [String: Any] in
      Self.listTracks(offset: offset, limit: limit)
    }
  }

  private static func listTracks(offset: Int, limit: Int) -> [String: Any] {
    guard MPMediaLibrary.authorizationStatus() == .authorized else {
      return ["tracks": [], "total": 0, "hasMore": false]
    }
    guard let items = MPMediaQuery.songs().items else {
      return ["tracks": [], "total": 0, "hasMore": false]
    }

    // MPMediaQuery has no native pagination — slice in Swift.
    let safeLimit = min(max(limit, 1), 200)
    let page = items.dropFirst(offset).prefix(safeLimit)
    let cacheDir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]

    var tracks: [[String: Any]] = []
    for item in page {
      tracks.append(Self.trackMap(for: item, cacheDir: cacheDir))
    }
    return [
      "tracks": tracks,
      "total": items.count,
      "hasMore": offset + page.count < items.count,
    ]
  }

  private static func trackMap(for item: MPMediaItem, cacheDir: URL) -> [String: Any] {
    let assetUrl = item.assetURL?.absoluteString

    var artworkUri: String? = nil
    if let artwork = item.artwork,
       let image = artwork.image(at: CGSize(width: 300, height: 300)),
       let data = image.jpegData(compressionQuality: 0.8) {
      let name = "rewind-artwork-\(item.persistentID).jpg"
      let url = cacheDir.appendingPathComponent(name)
      try? data.write(to: url)
      artworkUri = url.absoluteString
    }

    return [
      "id": "ipod:\(item.persistentID)",
      "title": item.title ?? "Unknown track",
      "artist": item.artist ?? "",
      "album": item.albumTitle ?? "",
      "durationMs": item.playbackDuration * 1000,
      "uri": assetUrl ?? "",
      "artworkUri": artworkUri ?? "",
      "drmProtected": assetUrl == nil,
    ]
  }
}
