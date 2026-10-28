// src/adapters/mockApiClient.ts
// In-memory ApiClient used by the mock-mode wiring in `app/services.ts` (spec
// 1C — Phase 3 swaps it for HttpApiClient) and by the core unit tests, which
// import it directly. Previously lived in __tests__/fixtures.
import type { ApiClient } from '../core/ports/apiClient'
import { ApiError } from '../core/domain/errors'
import type {
    ApiAlbum,
    ApiArtist,
    ApiTrack,
} from '../core/domain/normalize'
import type { ApiStake } from '../core/application/stakes'
import type { PlaylistSummary } from '../core/application/playlists'
import type { ApiUser } from '../core/application/bootstrap'
import type { DeviceResponse } from '../core/application/devices'

const DEFAULT_USER: ApiUser = {
    id: 'user-1',
    keycloak_id: 'kc-user-1',
    email: 'rewind@example.com',
    subscription_tier: 'free',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
}

export interface MockPlaylistRecord {
    summary: PlaylistSummary
    trackIds: string[]
}

export interface MockSeed {
    artists?: ApiArtist[]
    albums?: ApiAlbum[]
    tracks?: ApiTrack[]
    favoriteTracks?: ApiTrack[]
    playlists?: MockPlaylistRecord[]
    stakes?: ApiStake[]
    currentUserId?: string
    /** Track IDs the mock treats as owned. Omit → all tracks unlocked. */
    unlockedTrackIds?: string[]
    /** Omit → default user. `null` ⇒ /users/me returns 403 (unprovisioned). */
    user?: ApiUser | null
    devices?: DeviceResponse[]
}

export interface MockState {
    artists: ApiArtist[]
    albums: ApiAlbum[]
    tracks: ApiTrack[]
    favoriteTracks: ApiTrack[]
    playlists: Map<string, MockPlaylistRecord>
    stakes: ApiStake[]
    currentUserId: string
    /** null = all unlocked. */
    unlockedTrackIds: string[] | null
    user: ApiUser | null
    devices: DeviceResponse[]
}

export type MockMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface FailureInjection {
    method: MockMethod
    path: RegExp
    /** Default 500. */
    status?: number
    message?: string
    /** How many matching calls to fail. Default 1. Use Infinity for always. */
    times?: number
    /** How many matching calls to let through first. Default 0. */
    skip?: number
}

export interface RecordedCall {
    method: MockMethod
    path: string
    body?: unknown
    params?: Record<string, unknown>
}

export interface MockApiClient extends ApiClient {
    failNextRequest(failure: FailureInjection): void
    getState(): MockState
    getCalls(): RecordedCall[]
    clearCalls(): void
}

export function createMockApiClient(seed: MockSeed = {}): MockApiClient {
    const state: MockState = {
        artists: [...(seed.artists ?? [])],
        albums: [...(seed.albums ?? [])],
        tracks: [...(seed.tracks ?? [])],
        favoriteTracks: [...(seed.favoriteTracks ?? [])],
        playlists: new Map(
            (seed.playlists ?? []).map((p) => [
                p.summary.id,
                { summary: { ...p.summary }, trackIds: [...p.trackIds] },
            ]),
        ),
        stakes: [...(seed.stakes ?? [])],
        currentUserId: seed.currentUserId ?? 'user-1',
        unlockedTrackIds: seed.unlockedTrackIds
            ? [...seed.unlockedTrackIds]
            : null,
        user: seed.user === undefined ? DEFAULT_USER : seed.user,
        devices: (seed.devices ?? []).map((d) => ({ ...d })),
    }

    const calls: RecordedCall[] = []
    const failures: FailureInjection[] = []
    let playlistCounter = 1
    let deviceCounter = 1

    function takeFailure(method: MockMethod, path: string): FailureInjection | null {
        for (let i = 0; i < failures.length; i++) {
            const f = failures[i]!
            if (f.method !== method) continue
            if (!f.path.test(path)) continue

            const skip = f.skip ?? 0
            if (skip > 0) {
                failures[i] = { ...f, skip: skip - 1 }
                return null
            }

            const times = f.times ?? 1
            if (times === Infinity) return f
            if (times <= 1) {
                failures.splice(i, 1)
            } else {
                failures[i] = { ...f, times: times - 1 }
            }
            return f
        }
        return null
    }

    function maybeThrow(method: MockMethod, path: string): void {
        const f = takeFailure(method, path)
        if (f) throw new ApiError(f.status ?? 500, f.message ?? 'Injected failure')
    }

    function record(
        method: MockMethod,
        path: string,
        body?: unknown,
        params?: Record<string, unknown>,
    ): void {
        calls.push({ method, path, body, params })
    }

    function paramString(
        params: Record<string, unknown> | undefined,
        key: string,
    ): string | undefined {
        const v = params?.[key]
        return typeof v === 'string' ? v : undefined
    }

    function paramNumber(
        params: Record<string, unknown> | undefined,
        key: string,
    ): number | undefined {
        const v = params?.[key]
        return typeof v === 'number' ? v : undefined
    }

    function findTrack(id: string): ApiTrack {
        const t =
            state.tracks.find((x) => x.id === id) ??
            state.favoriteTracks.find((x) => x.id === id)
        if (!t) throw new ApiError(404, `Track ${id} not found`)
        return t
    }

    function findAlbum(id: string): ApiAlbum {
        const a = state.albums.find((x) => x.id === id)
        if (!a) throw new ApiError(404, `Album ${id} not found`)
        return a
    }

    function findPlaylist(id: string): MockPlaylistRecord {
        const p = state.playlists.get(id)
        if (!p) throw new ApiError(404, `Playlist ${id} not found`)
        return p
    }

    function includesCI(haystack: string | null | undefined, q: string): boolean {
        if (!haystack) return false
        return haystack.toLowerCase().includes(q.toLowerCase())
    }

    function artistName(artistId: string): string {
        return state.artists.find((a) => a.id === artistId)?.name ?? ''
    }

    function matchesArtistQuery(a: ApiArtist, q: string): boolean {
        return includesCI(a.name, q) || includesCI(a.bio, q)
    }
    function matchesAlbumQuery(a: ApiAlbum, q: string): boolean {
        return includesCI(a.title, q) || includesCI(artistName(a.artist_id), q)
    }
    function matchesTrackQuery(t: ApiTrack, q: string): boolean {
        return includesCI(t.title, q) || includesCI(artistName(t.artist_id), q)
    }

    /* ---------------- GET ---------------- */

    function handleGet<T>(
        path: string,
        params: Record<string, unknown> | undefined,
    ): T {
        if (path === '/artists/') {
            const q = paramString(params, 'q')
            const limit = paramNumber(params, 'limit')
            let out = state.artists
            if (q) out = out.filter((a) => matchesArtistQuery(a, q))
            if (limit != null) out = out.slice(0, limit)
            return out as unknown as T
        }
        const artistMatch = path.match(/^\/artists\/([^/]+)$/)
        if (artistMatch) {
            const artist = state.artists.find((a) => a.id === artistMatch[1])
            if (!artist) throw new ApiError(404, 'Artist not found')
            return artist as unknown as T
        }

        if (path === '/albums/') {
            const q = paramString(params, 'q')
            const artistId = paramString(params, 'artist_id')
            const limit = paramNumber(params, 'limit')
            let out = state.albums
            if (q) out = out.filter((a) => matchesAlbumQuery(a, q))
            if (artistId) out = out.filter((a) => a.artist_id === artistId)
            if (limit != null) out = out.slice(0, limit)
            return out as unknown as T
        }
        const albumMatch = path.match(/^\/albums\/([^/]+)$/)
        if (albumMatch) return findAlbum(albumMatch[1]!) as unknown as T

        if (path === '/tracks') {
            const q = paramString(params, 'q')
            const artistId = paramString(params, 'artist_id')
            const albumId = paramString(params, 'album_id')
            const limit = paramNumber(params, 'limit')
            let out = state.tracks
            if (q) out = out.filter((t) => matchesTrackQuery(t, q))
            if (artistId) out = out.filter((t) => t.artist_id === artistId)
            if (albumId) out = out.filter((t) => t.album_id === albumId)
            if (limit != null) out = out.slice(0, limit)
            return out as unknown as T
        }
        const trackMatch = path.match(/^\/tracks\/([^/]+)$/)
        if (trackMatch) return findTrack(trackMatch[1]!) as unknown as T

        if (path === '/favorites/') {
            return state.favoriteTracks as unknown as T
        }

        if (path === '/playlists/') {
            const summaries = Array.from(state.playlists.values()).map((p) => ({
                ...p.summary,
                track_count: p.trackIds.length,
            }))
            return summaries as unknown as T
        }
        const playlistMatch = path.match(/^\/playlists\/([^/]+)$/)
        if (playlistMatch) {
            const p = findPlaylist(playlistMatch[1]!)
            return {
                ...p.summary,
                track_count: p.trackIds.length,
                tracks: p.trackIds.map(findTrack),
            } as unknown as T
        }

        if (path === '/stakes/me') {
            return state.stakes as unknown as T
        }

        if (path === '/users/me') {
            if (!state.user) throw new ApiError(403, 'User not provisioned')
            return state.user as unknown as T
        }

        if (path === '/devices/') {
            return state.devices as unknown as T
        }

        if (path === '/playback/signed-url') {
            const trackId = paramString(params, 'track_id')
            if (!trackId) throw new ApiError(400, 'track_id required')
            if (
                state.unlockedTrackIds &&
                !state.unlockedTrackIds.includes(trackId)
            ) {
                throw new ApiError(403, 'Track access denied')
            }
            // Sentinel the URL resolver maps to a local bundled file in 1D.
            // Real backend returns an https presigned URL (R2) or a relative
            // /playback/stream/{id} path (legacy) — Phase 3 handles both.
            return { url: `mock://track/${trackId}` } as unknown as T
        }

        throw new ApiError(404, `No mock handler for GET ${path}`)
    }

    /* ---------------- POST ---------------- */

    function handlePost<T>(path: string, body: unknown): T {
        if (path === '/playlists/') {
            const payload = body as { name: string }
            const id = `playlist-${playlistCounter++}`
            const summary: PlaylistSummary = {
                id,
                user_id: state.currentUserId,
                name: payload.name,
                created_at: new Date(0).toISOString(),
                track_count: 0,
            }
            state.playlists.set(id, { summary, trackIds: [] })
            return summary as unknown as T
        }

        const addTrackMatch = path.match(/^\/playlists\/([^/]+)\/tracks$/)
        if (addTrackMatch) {
            const p = findPlaylist(addTrackMatch[1]!)
            const payload = body as { track_id: string }
            const track = findTrack(payload.track_id)
            p.trackIds.push(payload.track_id)
            return track as unknown as T
        }

        if (path === '/devices/register') {
            const payload = body as {
                device_type?: string
                capabilities?: { audio?: boolean; hls?: boolean }
            }
            const device: DeviceResponse = {
                id: `device-${deviceCounter++}`,
                user_id: state.currentUserId,
                device_type: payload.device_type ?? 'mobile',
                capabilities: {
                    audio: payload.capabilities?.audio ?? true,
                    hls: payload.capabilities?.hls ?? false,
                },
                registered_at: new Date().toISOString(),
            }
            state.devices.push(device)
            return device as unknown as T
        }

        throw new ApiError(404, `No mock handler for POST ${path}`)
    }

    /* ---------------- PUT ---------------- */

    function handlePut<T>(path: string): T {
        const favMatch = path.match(/^\/favorites\/([^/]+)$/)
        if (favMatch) {
            const trackId = favMatch[1]!
            const track = findTrack(trackId)
            if (!state.favoriteTracks.some((t) => t.id === trackId)) {
                state.favoriteTracks = [track, ...state.favoriteTracks]
            }
            return track as unknown as T
        }
        throw new ApiError(404, `No mock handler for PUT ${path}`)
    }

    /* ---------------- PATCH ---------------- */

    function handlePatch<T>(path: string, body: unknown): T {
        const reorderMatch = path.match(/^\/playlists\/([^/]+)\/reorder$/)
        if (reorderMatch) {
            const p = findPlaylist(reorderMatch[1]!)
            const payload = body as { new_order: string[] }
            for (const id of payload.new_order) {
                if (!p.trackIds.includes(id)) {
                    throw new ApiError(400, `Track ${id} not in playlist`)
                }
            }
            p.trackIds = [...payload.new_order]
            return p.trackIds.map(findTrack) as unknown as T
        }
        throw new ApiError(404, `No mock handler for PATCH ${path}`)
    }

    /* ---------------- DELETE ---------------- */

    function handleDelete<T>(path: string): T {
        const favMatch = path.match(/^\/favorites\/([^/]+)$/)
        if (favMatch) {
            const trackId = favMatch[1]!
            state.favoriteTracks = state.favoriteTracks.filter(
                (t) => t.id !== trackId,
            )
            return undefined as T
        }

        const removeTrackMatch = path.match(
            /^\/playlists\/([^/]+)\/tracks\/([^/]+)$/,
        )
        if (removeTrackMatch) {
            const p = findPlaylist(removeTrackMatch[1]!)
            const trackId = removeTrackMatch[2]!
            if (!p.trackIds.includes(trackId)) {
                throw new ApiError(404, 'Track not in playlist')
            }
            p.trackIds = p.trackIds.filter((id) => id !== trackId)
            return undefined as T
        }

        const playlistMatch = path.match(/^\/playlists\/([^/]+)$/)
        if (playlistMatch) {
            const id = playlistMatch[1]!
            if (!state.playlists.has(id)) throw new ApiError(404, 'Playlist not found')
            state.playlists.delete(id)
            return undefined as T
        }

        throw new ApiError(404, `No mock handler for DELETE ${path}`)
    }

    /* ---------------- Public client ---------------- */

    return {
        async get<T>(
            path: string,
            params?: Record<string, unknown>,
        ): Promise<T> {
            record('GET', path, undefined, params)
            maybeThrow('GET', path)
            return handleGet<T>(path, params)
        },
        async post<T>(
            path: string,
            body?: unknown,
            _opts?: { bare?: boolean },
        ): Promise<T> {
            record('POST', path, body)
            maybeThrow('POST', path)
            return handlePost<T>(path, body)
        },
        async put<T>(path: string, body?: unknown): Promise<T> {
            record('PUT', path, body)
            maybeThrow('PUT', path)
            return handlePut<T>(path)
        },
        async patch<T>(path: string, body?: unknown): Promise<T> {
            record('PATCH', path, body)
            maybeThrow('PATCH', path)
            return handlePatch<T>(path, body)
        },
        async delete<T = void>(path: string): Promise<T> {
            record('DELETE', path)
            maybeThrow('DELETE', path)
            return handleDelete<T>(path)
        },
        failNextRequest(failure: FailureInjection): void {
            failures.push(failure)
        },
        getState(): MockState {
            return {
                artists: [...state.artists],
                albums: [...state.albums],
                tracks: [...state.tracks],
                favoriteTracks: [...state.favoriteTracks],
                playlists: new Map(
                    Array.from(state.playlists.entries()).map(([k, v]) => [
                        k,
                        { summary: { ...v.summary }, trackIds: [...v.trackIds] },
                    ]),
                ),
                stakes: [...state.stakes],
                currentUserId: state.currentUserId,
                unlockedTrackIds: state.unlockedTrackIds
                    ? [...state.unlockedTrackIds]
                    : null,
                user: state.user ? { ...state.user } : null,
                devices: state.devices.map((d) => ({ ...d })),
            }
        },
        getCalls(): RecordedCall[] {
            return calls.map((c) => ({ ...c }))
        },
        clearCalls(): void {
            calls.length = 0
        },
    }
}