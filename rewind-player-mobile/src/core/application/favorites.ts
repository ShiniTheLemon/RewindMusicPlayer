import type { ApiClient } from '../ports/apiClient'
import type { Track } from '../domain/entities'
import type {
    ApiTrack,
    LookupMaps,
    NormalizeOptions,
} from '../domain/normalize'
import { normalizeTracks } from '../domain/normalize'

export interface FavoritesState {
    ids: readonly string[]
    tracks: readonly Track[]
}

export interface FavoritesUseCases {
    /** Fetch the server list, replacing local state. */
    load(): Promise<FavoritesState>
    /** Optimistic add. Rolls back and rethrows on failure. */
    add(trackId: string, track?: Track): Promise<void>
    /** Optimistic remove. Rolls back and rethrows on failure. */
    remove(trackId: string): Promise<void>
    isFavorite(trackId: string): boolean
    getState(): FavoritesState
}

export interface FavoritesDeps {
    api: ApiClient
    normalizeOpts: NormalizeOptions
    /** Optional: used to resolve names when normalizing `GET /favorites/`. */
    getCatalogMaps?: () => LookupMaps
}

const EMPTY_MAPS: LookupMaps = {
    artistMap: new Map(),
    albumMap: new Map(),
}

/**
 * §6.2. Stateful because optimistic rollback needs the pre-mutation position.
 * A feature-layer store (TanStack Query mutation or Zustand) wraps this; core
 * stays framework-free.
 */
export function createFavorites(deps: FavoritesDeps): FavoritesUseCases {
    let ids: string[] = []
    let tracks: Track[] = []

    const snapshot = (): FavoritesState => ({
        ids: [...ids],
        tracks: [...tracks],
    })

    return {
        async load() {
            const apiTracks = await deps.api.get<ApiTrack[]>('/favorites/')
            const maps = deps.getCatalogMaps?.() ?? EMPTY_MAPS
            tracks = normalizeTracks(apiTracks, maps, deps.normalizeOpts)
            ids = tracks.map((t) => t.id)
            return snapshot()
        },

        async add(trackId, track) {
            // The server PUT is idempotent (§3.4); mirror that locally.
            if (ids.includes(trackId)) return

            ids = [trackId, ...ids]
            const addedTrack = track ?? null
            if (addedTrack) tracks = [addedTrack, ...tracks]

            try {
                await deps.api.put(`/favorites/${trackId}`)
            } catch (error) {
                ids = ids.filter((id) => id !== trackId)
                if (addedTrack) tracks = tracks.filter((t) => t.id !== trackId)
                throw error
            }
        },

        async remove(trackId) {
            const idIndex = ids.indexOf(trackId)
            if (idIndex === -1) return

            const trackIndex = tracks.findIndex((t) => t.id === trackId)
            const removedTrack = trackIndex >= 0 ? tracks[trackIndex]! : null

            ids = ids.filter((id) => id !== trackId)
            tracks = tracks.filter((t) => t.id !== trackId)

            try {
                await deps.api.delete(`/favorites/${trackId}`)
            } catch (error) {
                // Re-insert at the recorded index, not the tail.
                ids = [...ids.slice(0, idIndex), trackId, ...ids.slice(idIndex)]
                if (removedTrack !== null) {
                    tracks = [
                        ...tracks.slice(0, trackIndex),
                        removedTrack,
                        ...tracks.slice(trackIndex),
                    ]
                }
                throw error
            }
        },

        isFavorite(trackId) {
            return ids.includes(trackId)
        },

        getState: snapshot,
    }
}