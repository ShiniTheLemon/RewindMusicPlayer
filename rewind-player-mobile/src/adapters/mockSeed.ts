// src/adapters/mockSeed.ts
import type { ApiAlbum, ApiArtist, ApiTrack } from '../core/domain/normalize'
import type { ApiStake } from '../core/application/stakes'
import type { MockPlaylistRecord, MockSeed } from './mockApiClient'

const artists: ApiArtist[] = [
  { id: 'artist-1', name: 'Neon Palms', bio: 'Synthwave from the coast', user_id: 'kc-a1', profile_pic_path: null },
  { id: 'artist-2', name: 'Carla Mendes', bio: 'Jazz vocalist', user_id: 'kc-a2', profile_pic_path: null },
  { id: 'artist-3', name: 'The Quiet Hours', bio: 'Ambient quartet', user_id: 'kc-a3', profile_pic_path: null },
  { id: 'artist-4', name: 'Static Fields', bio: 'Shoegaze revival', user_id: 'kc-a4', profile_pic_path: null },
  { id: 'artist-5', name: 'Renata Villalobos', bio: 'Folk singer-songwriter', user_id: 'kc-a5', profile_pic_path: null },
  { id: 'artist-6', name: 'Echo Sound System', bio: 'Dub and bass', user_id: 'kc-a6', profile_pic_path: null },
]

const albums: ApiAlbum[] = [
  { id: 'album-1', title: 'Late Reflections', artist_id: 'artist-1', release_date: '2024-11-02', cover_art_path: null },
  { id: 'album-2', title: 'Maresia', artist_id: 'artist-2', release_date: '2025-01-15', cover_art_path: null },
  { id: 'album-3', title: 'Small Hours', artist_id: 'artist-3', release_date: '2024-06-10', cover_art_path: null },
  { id: 'album-4', title: 'Blur Geometry', artist_id: 'artist-4', release_date: '2023-09-22', cover_art_path: null },
  { id: 'album-5', title: 'Cuadernos', artist_id: 'artist-5', release_date: '2025-03-04', cover_art_path: null },
  { id: 'album-6', title: 'Bass Cathedral', artist_id: 'artist-6', release_date: null, cover_art_path: null },
  { id: 'album-7', title: 'Live at the Pier', artist_id: 'artist-1', release_date: '2022-08-30', cover_art_path: null },
  { id: 'album-8', title: 'Half Light', artist_id: 'artist-3', release_date: '2021-04-12', cover_art_path: null },
]

// Every cover_art_path is null on purpose: the mock never serves assets, so
// cards fall back to staticCover and the UI stays consistent when the tunnel
// is down. assetUrl() is exercised in 1B unit tests.
const tracks: ApiTrack[] = [
  { id: 'track-1', title: 'Coastline', artist_id: 'artist-1', album_id: 'album-1', duration: 218000, file_path: null, cover_art_path: null, extra_metadata: { explicit: false } },
  { id: 'track-2', title: 'Glass Harbor', artist_id: 'artist-1', album_id: 'album-1', duration: 232000, file_path: null, cover_art_path: null, extra_metadata: { explicit: false } },
  { id: 'track-3', title: 'Half-Cocked Moon', artist_id: 'artist-1', album_id: 'album-1', duration: 194000, file_path: null, cover_art_path: null, extra_metadata: { explicit: true } },
  { id: 'track-4', title: 'Maresia', artist_id: 'artist-2', album_id: 'album-2', duration: 247000, file_path: null, cover_art_path: null, extra_metadata: { explicit: false } },
  { id: 'track-5', title: 'Areia', artist_id: 'artist-2', album_id: 'album-2', duration: 201000, file_path: null, cover_art_path: null, extra_metadata: { explicit: false } },
  { id: 'track-6', title: 'Two A.M.', artist_id: 'artist-3', album_id: 'album-3', duration: 312000, file_path: null, cover_art_path: null, extra_metadata: { explicit: false } },
  { id: 'track-7', title: 'Slow Fan', artist_id: 'artist-3', album_id: 'album-3', duration: 289000, file_path: null, cover_art_path: null, extra_metadata: { explicit: false } },
  { id: 'track-8', title: 'Gauze', artist_id: 'artist-4', album_id: 'album-4', duration: 264000, file_path: null, cover_art_path: null, extra_metadata: { explicit: false } },
  { id: 'track-9', title: 'Static Bloom', artist_id: 'artist-4', album_id: 'album-4', duration: 240000, file_path: null, cover_art_path: null, extra_metadata: { explicit: false } },
  { id: 'track-10', title: 'Cuaderno Uno', artist_id: 'artist-5', album_id: 'album-5', duration: 199000, file_path: null, cover_art_path: null, extra_metadata: { explicit: false } },
  { id: 'track-11', title: 'Verano', artist_id: 'artist-5', album_id: 'album-5', duration: 220000, file_path: null, cover_art_path: null, extra_metadata: { explicit: false } },
  { id: 'track-12', title: 'Dub 1', artist_id: 'artist-6', album_id: 'album-6', duration: 275000, file_path: null, cover_art_path: null, extra_metadata: { explicit: false } },
  { id: 'track-13', title: 'Coastline (Live)', artist_id: 'artist-1', album_id: 'album-7', duration: 245000, file_path: null, cover_art_path: null, extra_metadata: { explicit: false } },
  { id: 'track-14', title: 'Half Light', artist_id: 'artist-3', album_id: 'album-8', duration: 320000, file_path: null, cover_art_path: null, extra_metadata: { explicit: false } },
  { id: 'track-15', title: 'Single Lens', artist_id: 'artist-4', album_id: null, duration: 210000, file_path: null, cover_art_path: null, extra_metadata: { explicit: false } },
]

const favoriteTracks: ApiTrack[] = [tracks[1]!, tracks[3]!, tracks[7]!]

const playlists: MockPlaylistRecord[] = [
  { summary: { id: 'pl-1', user_id: 'user-1', name: 'Morning set', created_at: '2024-02-01T00:00:00Z', track_count: 3 }, trackIds: ['track-4', 'track-10', 'track-2'] },
  { summary: { id: 'pl-2', user_id: 'user-1', name: 'Focus', created_at: '2024-03-15T00:00:00Z', track_count: 2 }, trackIds: ['track-6', 'track-14'] },
  { summary: { id: 'pl-3', user_id: 'user-2', name: 'Shared favorites', created_at: '2024-04-20T00:00:00Z', track_count: 2 }, trackIds: ['track-8', 'track-9'] },
]

const stakes: ApiStake[] = [
  { id: 'stake-1', user_id: 'user-1', track_id: 'track-1', album_id: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'stake-2', user_id: 'user-1', track_id: 'track-5', album_id: null, created_at: '2024-01-02T00:00:00Z' },
  { id: 'stake-3', user_id: 'user-1', track_id: null, album_id: 'album-2', created_at: '2024-01-03T00:00:00Z' },
]

export const MOCK_SEED: MockSeed = {
  artists,
  albums,
  tracks,
  favoriteTracks,
  playlists,
  stakes,
  currentUserId: 'user-1',
  // Deny tracks owned via album stakes too? §3.6 says album stakes grant
  // access to all their tracks. In 1D we don't compute this — the mock uses
  // a flat allowlist. Phase 4 will resolve album stakes to tracks server-side.
  unlockedTrackIds: [
    'track-1', 'track-2', 'track-4', 'track-5', 'track-6',
    'track-10', 'track-11',
  ],
}
