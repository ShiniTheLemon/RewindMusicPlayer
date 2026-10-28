// src/core/ports/deviceMusic.ts

/** One audio file from the device's local music library. */
export interface DeviceTrackFile {
    /** Opaque native id (e.g. `media:123`, `ipod:456`). */
    id: string
    title: string
    artist: string | null
    album: string | null
    durationMs: number | null
    /** Playable URI — content:// on Android, ipod-library:// on iOS. null ⇒ DRM-protected. */
    uri: string | null
    /** Cached artwork file URI, or null to use the static cover. */
    artworkUri: string | null
    drmProtected: boolean
}

export interface DeviceMusicPage {
    tracks: DeviceTrackFile[]
    total: number
    hasMore: boolean
}

/**
 * Enumerates the device's local music library (MediaStore on Android,
 * MPMediaQuery on iOS). Implemented by the rewind-device-music native
 * module behind src/adapters/deviceMusic.ts.
 */
export interface DeviceMusicSource {
    getPermission(): Promise<boolean>
    requestPermission(): Promise<boolean>
    listTracks(offset: number, limit: number): Promise<DeviceMusicPage>
}
