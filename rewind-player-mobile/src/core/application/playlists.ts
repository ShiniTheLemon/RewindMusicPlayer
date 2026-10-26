import type { ApiClient } from '../ports/apiClient'
import type { Track } from '../domain/entities'
import type {
    ApiTrack,
    LookupMaps,
    NormalizeOptions,
} from '../domain/normalize'
import { normalizeTracks } from '../domain/normalize'

export interface PlaylistSummary {
    id: string
    user_id: string
    name: string
    created_at: string
    track_count: number
}

export interface PlaylistDetail extends PlaylistSummary {
    tracks: Track[]
}

export interface CreatePlaylistResult {
    playlist: PlaylistSummary
    /** Tracks the server rejected, in the order they were attempted. */
    failedTrackIds: string[]
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

export async function loadPlaylists(
    api: ApiClient,
): Promise<PlaylistSummary[]> {
    return api.get<PlaylistSummary[]>('/playlists/')
}

export async function loadPlaylist(
    api: ApiClient,
    id: string,
    opts: NormalizeOptions,
    maps: LookupMaps,
): Promise<PlaylistDetail> {
    const detail = await api.get<PlaylistSummary & { tracks: ApiTrack[] }>(
        `/playlists/${id}`,
    )
    return { ...detail, tracks: normalizeTracks(detail.tracks, maps, opts) }
}

/* ------------------------------------------------------------------ */
/* Create (§6.3): POST playlist, then POST each track sequentially.    */
/* Partial failures are tolerated and surfaced as `failedTrackIds`.    */
/* ------------------------------------------------------------------ */

export async function createPlaylist(
    api: ApiClient,
    name: string,
    tracks: readonly Track[],
): Promise<CreatePlaylistResult> {
    const playlist = await api.post<PlaylistSummary>('/playlists/', { name })

    const failedTrackIds: string[] = []
    for (const track of tracks) {
        try {
            await api.post(`/playlists/${playlist.id}/tracks`, {
                track_id: track.id,
            })
        } catch {
            failedTrackIds.push(track.id)
        }
    }

    return { playlist, failedTrackIds }
}

/* ------------------------------------------------------------------ */
/* Edit diff (§6.3) — the predecessor's applyEditChanges algorithm.    */
/* ------------------------------------------------------------------ */

export interface EditDiff {
    removed: string[]
    added: string[]
    /** The full final order — what PATCH /reorder receives. */
    finalOrder: string[]
}

export function computeEditDiff(
    initial: readonly string[],
    final: readonly string[],
): EditDiff {
    const initialSet = new Set(initial)
    const finalSet = new Set(final)
    return {
        removed: initial.filter((id) => !finalSet.has(id)),
        added: final.filter((id) => !initialSet.has(id)),
        finalOrder: [...final],
    }
}

export async function applyPlaylistEdit(
    api: ApiClient,
    playlistId: string,
    initial: readonly string[],
    final: readonly string[],
    opts: NormalizeOptions,
    maps: LookupMaps,
): Promise<Track[]> {
    const { removed, added, finalOrder } = computeEditDiff(initial, final)

    for (const trackId of removed) {
        await api.delete(`/playlists/${playlistId}/tracks/${trackId}`)
    }
    for (const trackId of added) {
        await api.post(`/playlists/${playlistId}/tracks`, { track_id: trackId })
    }

    // Always reorder — the API is the source of truth for order, and the spec
    // says step 3 is unconditional.
    const reordered = await api.patch<ApiTrack[]>(
        `/playlists/${playlistId}/reorder`,
        { new_order: finalOrder },
    )
    return normalizeTracks(reordered, maps, opts)
}

/* ------------------------------------------------------------------ */
/* Remove / delete / guard                                             */
/* ------------------------------------------------------------------ */

export async function removeTrackFromPlaylist(
    api: ApiClient,
    playlistId: string,
    trackId: string,
): Promise<void> {
    await api.delete(`/playlists/${playlistId}/tracks/${trackId}`)
}

export async function deletePlaylist(
    api: ApiClient,
    id: string,
): Promise<void> {
    await api.delete(`/playlists/${id}`)
}

export function canEditPlaylist(
    playlist: PlaylistSummary,
    currentUserId: string | null | undefined,
): boolean {
    if (!currentUserId) return false
    return playlist.user_id === currentUserId
}