import type { ApiClient } from '../ports/apiClient'
import type { Album, Artist, Track } from '../domain/entities'
import type {
    ApiAlbum,
    ApiArtist,
    ApiTrack,
    LookupMaps,
    NormalizeOptions,
} from '../domain/normalize'
import {
    normalizeAlbums,
    normalizeArtists,
    normalizeTracks,
} from '../domain/normalize'

export const SEARCH_DEFAULT_LIMIT = 20
export const SEARCH_TRACK_PICKER_LIMIT = 50

export interface SearchResults {
    artists: Artist[]
    albums: Album[]
    tracks: Track[]
}

export const EMPTY_SEARCH_RESULTS: SearchResults = {
    artists: [],
    albums: [],
    tracks: [],
}

/**
 * §6.5. Empty query → no requests, empty results.
 *
 * The three requests run in parallel (`Promise.all`): a failure in any one
 * fails the whole search — the spec's wording is literal here. Catalog
 * availability is a separate, best-effort concern handled by the caller.
 *
 * `catalogMaps` lets names resolve for rows the catalog already knows,
 * even when they are not in the search response. The search response's own
 * artists/albums are merged into the maps so same-batch references resolve.
 */
export async function searchCatalog(
    api: ApiClient,
    query: string,
    opts: NormalizeOptions,
    catalogMaps?: LookupMaps,
    limit: number = SEARCH_DEFAULT_LIMIT,
): Promise<SearchResults> {
    const trimmed = query.trim()
    if (!trimmed) return EMPTY_SEARCH_RESULTS

    const [apiArtists, apiAlbums, apiTracks] = await Promise.all([
        api.get<ApiArtist[]>('/artists/', { q: trimmed, limit }),
        api.get<ApiAlbum[]>('/albums/', { q: trimmed, limit }),
        api.get<ApiTrack[]>('/tracks', { q: trimmed, limit }),
    ])

    const artists = normalizeArtists(apiArtists, opts)

    const artistMap = new Map<string, Artist>(catalogMaps?.artistMap ?? [])
    for (const a of artists) artistMap.set(a.id, a)

    const albumMap = new Map<string, Album>(catalogMaps?.albumMap ?? [])
    const albums = normalizeAlbums(apiAlbums, { artistMap, albumMap }, opts)
    for (const a of albums) albumMap.set(a.id, a)

    const tracks = normalizeTracks(apiTracks, { artistMap, albumMap }, opts)

    return { artists, albums, tracks }
}