import type { ApiClient } from '../ports/apiClient'
import type { Album, Track } from '../domain/entities'
import type {
    ApiAlbum,
    ApiTrack,
    LookupMaps,
    NormalizeOptions,
} from '../domain/normalize'
import { normalizeAlbum, normalizeTrack } from '../domain/normalize'

export interface ApiStake {
    id: string
    user_id: string
    track_id: string | null
    album_id: string | null
    created_at: string
}

export interface ResolvedStakes {
    ownedTracks: Track[]
    ownedAlbums: Album[]
}

/**
 * §3.6 / §6.6. Each stake is resolved individually — a 404 on one item must
 * not drop the list. Duplicate IDs are skipped. Exactly one of track_id /
 * album_id is set per stake, so a stake lands in one bucket or the other
 * ("split", per §6.6).
 *
 * Note: album-level stakes grant playback access to their tracks server-side
 * (§3.6), but the Library split is by stake type — an album stake belongs in
 * ownedAlbums, not duplicated into ownedTracks.
 */
export async function resolveStakes(
    api: ApiClient,
    opts: NormalizeOptions,
    maps: LookupMaps,
): Promise<ResolvedStakes> {
    const stakes = await api.get<ApiStake[]>('/stakes/me')

    const ownedTracks: Track[] = []
    const ownedAlbums: Album[] = []
    const seenTracks = new Set<string>()
    const seenAlbums = new Set<string>()

    for (const stake of stakes) {
        if (stake.track_id) {
            if (seenTracks.has(stake.track_id)) continue
            seenTracks.add(stake.track_id)
            try {
                const apiTrack = await api.get<ApiTrack>(`/tracks/${stake.track_id}`)
                const track = normalizeTrack(apiTrack, maps, opts)
                if (track) ownedTracks.push(track)
            } catch {
                // Missing / deleted / forbidden — skip this one, keep the rest.
            }
        } else if (stake.album_id) {
            if (seenAlbums.has(stake.album_id)) continue
            seenAlbums.add(stake.album_id)
            try {
                const apiAlbum = await api.get<ApiAlbum>(`/albums/${stake.album_id}`)
                const album = normalizeAlbum(apiAlbum, maps, opts)
                if (album) ownedAlbums.push(album)
            } catch {
                // Same policy as tracks.
            }
        }
    }

    return { ownedTracks, ownedAlbums }
}