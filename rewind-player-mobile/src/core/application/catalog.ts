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
    buildLookupMaps,
    normalizeAlbums,
    normalizeArtists,
    normalizeTracks,
} from '../domain/normalize'

export interface CatalogSnapshot {
    artists: Artist[]
    albums: Album[]
    tracks: Track[]
    artistMap: Map<string, Artist>
    albumMap: Map<string, Album>
}

/**
 * §6.4: fetch artists → albums → tracks, sequentially, because each stage
 * needs the lookup maps built from the prior one.
 *
 * No `limit` is passed — the server defaults to 100 (§3) and the predecessor
 * fetched full lists.
 */
export async function fetchCatalog(
    api: ApiClient,
    opts: NormalizeOptions,
): Promise<CatalogSnapshot> {
    const apiArtists = await api.get<ApiArtist[]>('/artists/')
    const artists = normalizeArtists(apiArtists, opts)

    const artistOnly: LookupMaps = {
        artistMap: new Map(artists.map((a) => [a.id, a] as const)),
        albumMap: new Map(),
    }

    const apiAlbums = await api.get<ApiAlbum[]>('/albums/')
    const albums = normalizeAlbums(apiAlbums, artistOnly, opts)

    const maps = buildLookupMaps(artists, albums)

    const apiTracks = await api.get<ApiTrack[]>('/tracks')
    const tracks = normalizeTracks(apiTracks, maps, opts)

    return { artists, albums, tracks, ...maps }
}

/* ------------------------------------------------------------------ */
/* Pure selectors (§6.4) — no API sort, no state                        */
/* ------------------------------------------------------------------ */

function releaseTime(dateStr: string | null | undefined): number {
    if (!dateStr) return 0
    const t = Date.parse(dateStr)
    return Number.isFinite(t) ? t : 0
}

export function selectNewestAlbums(
    albums: readonly Album[],
    limit?: number,
): Album[] {
    const sorted = [...albums].sort(
        (a, b) => releaseTime(b.release_date) - releaseTime(a.release_date),
    )
    return limit != null ? sorted.slice(0, limit) : sorted
}

export function selectNewestTracks(
    tracks: readonly Track[],
    limit?: number,
): Track[] {
    const sorted = [...tracks].sort(
        (a, b) => releaseTime(b.release_date) - releaseTime(a.release_date),
    )
    return limit != null ? sorted.slice(0, limit) : sorted
}

/**
 * Artists have no created_at (§3.2). "Newest" is defined as the artist whose
 * most recent album dropped most recently.
 */
export function selectNewestArtists(
    artists: readonly Artist[],
    albums: readonly Album[],
    limit?: number,
): Artist[] {
    const latestByArtist = new Map<string, number>()
    for (const album of albums) {
        const t = releaseTime(album.release_date)
        const prev = latestByArtist.get(album.artist_id) ?? 0
        if (t > prev) latestByArtist.set(album.artist_id, t)
    }
    const sorted = [...artists].sort((a, b) => {
        const ta = latestByArtist.get(a.id) ?? 0
        const tb = latestByArtist.get(b.id) ?? 0
        return tb - ta
    })
    return limit != null ? sorted.slice(0, limit) : sorted
}

/**
 * Fisher-Yates shuffle. RNG is injectable so tests can be deterministic.
 * Home uses this with Math.random (§6.4).
 */
export function selectFeaturedArtists(
    artists: readonly Artist[],
    limit: number,
    rng: () => number = Math.random,
): Artist[] {
    const copy = [...artists]
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1))
        const tmp = copy[i]!
        copy[i] = copy[j]!
        copy[j] = tmp
    }
    return copy.slice(0, limit)
}