// src/core/application/deviceMusic.ts
import type { CoverSource, Track } from '../domain/entities'
import type { DeviceTrackFile } from '../ports/deviceMusic'

const LOCAL_ARTIST_ID = 'local-artist'

/**
 * Maps a device-local audio file onto the catalog Track shape so every
 * existing row/player component works unchanged. The `local:` id prefix is
 * what the URL resolver keys on to skip the signed-url endpoint.
 */
export function deviceTrackToTrack(
    file: DeviceTrackFile,
    staticCover: CoverSource,
): Track {
    const artistName = file.artist?.trim() || 'Unknown artist'
    return {
        id: `local:${file.id}`,
        title: file.title.trim() === '' ? 'Unknown track' : file.title,
        artist_id: LOCAL_ARTIST_ID,
        artist: { id: LOCAL_ARTIST_ID, name: artistName, keycloakId: null },
        album_id: null,
        album: null,
        duration: file.durationMs ?? 0,
        cover: file.artworkUri ?? staticCover,
        explicit: false,
        // Resolved at enumeration time — device files have no signed URL.
        url: file.uri,
        release_date: null,
    }
}
