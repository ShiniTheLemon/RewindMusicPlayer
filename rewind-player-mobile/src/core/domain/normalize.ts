// Phase 1 will port the predecessor's normalize module here.
import type { Album, Artist, CoverSource, Track } from './entities'

/* ------------------------------------------------------------------ */
/* API row shapes (§3.2). Only the fields the client consumes.         */
/* ------------------------------------------------------------------ */

export interface ApiArtist {
    id: string
    name?: string | null
    bio?: string | null
    user_id?: string | null
    profile_pic_path?: string | null
}

export interface ApiAlbum {
    id: string
    title: string
    artist_id: string
    release_date?: string | null
    cover_art_path?: string | null
    track_count?: number | null
}

export interface ApiTrack {
    id: string
    title: string
    artist_id: string
    album_id?: string | null
    duration?: number | null
    file_path?: string | null
    cover_art_path?: string | null
    extra_metadata?: Record<string, unknown> | null
}

/* ------------------------------------------------------------------ */
/* Injection & lookup maps                                             */
/* ------------------------------------------------------------------ */

export interface NormalizeOptions {
    /** API base including the /api/v1 prefix. A trailing slash is tolerated. */
    apiBase: string
    /** Placeholder injected by the host platform (a bundled asset id in RN). */
    staticCover: CoverSource
}

export interface LookupMaps {
    artistMap: Map<string, Artist>
    albumMap: Map<string, Album>
}

export function buildLookupMaps(artists: Artist[], albums: Album[]): LookupMaps {
    return {
        artistMap: new Map(artists.map((a) => [a.id, a] as const)),
        albumMap: new Map(albums.map((a) => [a.id, a] as const)),
    }
}

/* ------------------------------------------------------------------ */
/* Asset URLs (§3.3)                                                   */
/* ------------------------------------------------------------------ */

const ASSET_FILENAME_RE = /^[0-9a-f]{32}\.(jpg|jpeg|png|webp|gif)$/

/**
 * Maps a stored `*_path` to a playable asset URL.
 *
 * Rule from §3.3: take the basename; if it matches the 32-hex-char filename
 * pattern, the URL is `${apiBase}/assets/${basename}`. Anything else — missing
 * path, nested-looking upload paths, query strings, uppercase hex — yields null
 * so the caller can fall back to the placeholder.
 */
export function assetUrl(
    path: string | null | undefined,
    apiBase: string,
): string | null {
    if (!path) return null
    const basename = path.split('/').pop()
    if (!basename || !ASSET_FILENAME_RE.test(basename)) return null
    return `${apiBase.replace(/\/+$/, '')}/assets/${basename}`
}

function resolveCover(
    path: string | null | undefined,
    opts: NormalizeOptions,
): CoverSource {
    return assetUrl(path, opts.apiBase) ?? opts.staticCover
}

/* ------------------------------------------------------------------ */
/* Normalizers — return null for null input (§4)                       */
/* ------------------------------------------------------------------ */

export function normalizeArtist(
    api: ApiArtist | null | undefined,
    opts: NormalizeOptions,
): Artist | null {
    if (!api) return null
    const name = typeof api.name === 'string' ? api.name.trim() : ''
    return {
        id: api.id,
        name: name.length > 0 ? name : 'Unknown Artist',
        bio: api.bio ?? '',
        keycloakId: api.user_id ?? null,
        avatar: resolveCover(api.profile_pic_path, opts),
        follower_count: 0,
    }
}

export function normalizeAlbum(
    api: ApiAlbum | null | undefined,
    maps: LookupMaps,
    opts: NormalizeOptions,
): Album | null {
    if (!api) return null
    const artist = maps.artistMap.get(api.artist_id)
    return {
        id: api.id,
        title: api.title,
        artist_id: api.artist_id,
        artist: artist
            ? { id: artist.id, name: artist.name }
            : { id: api.artist_id, name: 'Unknown Artist' },
        release_date: api.release_date ?? null,
        cover: resolveCover(api.cover_art_path, opts),
        track_count: api.track_count ?? null,
    }
}

export function normalizeTrack(
    api: ApiTrack | null | undefined,
    maps: LookupMaps,
    opts: NormalizeOptions,
): Track | null {
    if (!api) return null

    const artist = maps.artistMap.get(api.artist_id)
    const albumId = api.album_id ?? null
    const album = albumId ? maps.albumMap.get(albumId) : undefined

    return {
        id: api.id,
        title: api.title,
        artist_id: api.artist_id,
        artist: {
            id: artist?.id ?? api.artist_id,
            name: artist?.name ?? 'Unknown Artist',
            keycloakId: artist?.keycloakId ?? null,
        },
        album_id: albumId,
        album: album ? { id: album.id, title: album.title } : null,
        duration:
            typeof api.duration === 'number' && Number.isFinite(api.duration)
                ? api.duration
                : 0,
        cover: resolveCover(api.cover_art_path, opts),
        // Strict boolean: a string 'false' or a 1 must not be read as explicit.
        explicit: api.extra_metadata?.explicit === true,
        url: null,
        release_date: album?.release_date ?? null,
    }
}

/* ------------------------------------------------------------------ */
/* List helpers — drop nulls in one place instead of at every call site */
/* ------------------------------------------------------------------ */

export function normalizeArtists(
    list: readonly ApiArtist[],
    opts: NormalizeOptions,
): Artist[] {
    return list
        .map((a) => normalizeArtist(a, opts))
        .filter((a): a is Artist => a !== null)
}

export function normalizeAlbums(
    list: readonly ApiAlbum[],
    maps: LookupMaps,
    opts: NormalizeOptions,
): Album[] {
    return list
        .map((a) => normalizeAlbum(a, maps, opts))
        .filter((a): a is Album => a !== null)
}

export function normalizeTracks(
    list: readonly ApiTrack[],
    maps: LookupMaps,
    opts: NormalizeOptions,
): Track[] {
    return list
        .map((t) => normalizeTrack(t, maps, opts))
        .filter((t): t is Track => t !== null)
}