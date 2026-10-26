// Phase 1 will port playback orchestration here.
/**
 * Normalized domain entities (§4 of the migration spec).
 *
 * The API returns thin rows (foreign keys only). `normalize.ts` is the single
 * place that widens them into these rich objects; every UI component and
 * use-case consumes these shapes instead of the API shapes.
 */

/**
 * A cover/avatar value.
 *  - `string` → an absolute URL produced by `assetUrl()`.
 *  - `number` → a React Native bundled asset id (the injected STATIC_COVER).
 *
 * Core never imports an image asset itself; the placeholder is injected through
 * `NormalizeOptions.staticCover` at the composition root.
 */
export type CoverSource = string | number

export interface Artist {
    id: string
    /** 'Unknown Artist' when the API row has no usable name. */
    name: string
    /** '' when the API row has no bio. */
    bio: string
    /** The artist's *Keycloak* id (`apiArtist.user_id`) — NOT the player-DB user id. */
    keycloakId: string | null
    avatar: CoverSource
    /** Always 0 — the API exposes no follower data yet. */
    follower_count: number
}

export interface AlbumArtistRef {
    id: string
    name: string
}

export interface Album {
    id: string
    title: string
    artist_id: string
    /** Resolved from the artist map, or an 'Unknown Artist' stub. */
    artist: AlbumArtistRef
    /** 'YYYY-MM-DD', or null when the API omits it. */
    release_date: string | null
    cover: CoverSource
    /** null on list endpoints — the API does not send a count there. */
    track_count: number | null
}

export interface TrackArtistRef {
    id: string
    name: string
    keycloakId: string | null
}

export interface TrackAlbumRef {
    id: string
    title: string
}

export interface Track {
    id: string
    title: string
    artist_id: string
    artist: TrackArtistRef
    album_id: string | null
    album: TrackAlbumRef | null
    /** Milliseconds. */
    duration: number
    cover: CoverSource
    /** `extra_metadata.explicit` — treated strictly as a boolean. */
    explicit: boolean
    /** Always null after normalization; resolved at play time (§3.8). */
    url: string | null
    /** Inherited from the parent album, used for "newest" sorting (§6.4). */
    release_date: string | null
}