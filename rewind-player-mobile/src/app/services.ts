// src/app/services.ts
import { Asset } from 'expo-asset'
import { createFavorites } from '../core/application/favorites'
import type { Services } from '../core/application/services'
import type { AppConfig } from '../core/domain/config'
import type { NormalizeOptions } from '../core/domain/normalize'
import type { Track } from '../core/domain/entities'
import { createMockApiClient } from '../adapters/mockApiClient'
import { createExpoAudioEngine } from '../adapters/expoAudioEngine'
import { createDeviceMusicSource } from '../adapters/deviceMusic'
import { MOCK_SEED } from '../adapters/mockSeed'
import { installPlaybackDeps } from '../features/playback/playbackStore'

// Bundled placeholder injected into normalize(). If your scaffold puts assets
// somewhere other than assets/, fix this path — the compiler will not
// catch it because require() is untyped.
const STATIC_COVER = require('../../assets/icon.png') as number

// Bundled 1D test audio. The app plays it for every unlocked track until
// Phase 3 wires the real backend.
const LOCAL_TEST_AUDIO_URI =
  Asset.fromModule(require('../../assets/audio/test-track.mp3') as number).uri

export function createServices(config: AppConfig): Services {
  // 1C: mock adapter. Phase 3 will swap this single line for HttpApiClient.
  const api = createMockApiClient(MOCK_SEED)
  const normalizeOpts: NormalizeOptions = {
    apiBase: config.apiBaseUrl,
    staticCover: STATIC_COVER,
  }
  const favorites = createFavorites({ api, normalizeOpts })

  const services: Services = {
    config,
    api,
    normalizeOpts,
    favorites,
    deviceMusic: createDeviceMusicSource(),
  }

  installPlaybackDeps({
    engine: createExpoAudioEngine(),
    resolveUrl: (track: Track) => resolvePlaybackUrl(services, track),
  })

  return services
}

/**
 * §3.8 URL resolution. Handles the three cases the backend returns:
 *   - https presigned URL           → play directly (Phase 3+)
 *   - relative /playback/stream/... → authed stream with headers (Phase 3+)
 *   - mock:// sentinel (1D)         → map to a bundled local file
 * 403 from signed-url is thrown as ApiError(403) so the store opens the
 * purchase prompt (§6.1).
 */
async function resolvePlaybackUrl(services: Services, track: Track): Promise<string> {
  // Device-local tracks carry their URI from enumeration time — no signed
  // URL, no stake check. Null URI ⇒ DRM-protected (iOS).
  if (track.id.startsWith('local:')) {
    if (!track.url) {
      throw new Error('This track is DRM-protected and cannot be played')
    }
    return track.url
  }

  const { url } = await services.api.get<{ url: string }>(
    '/playback/signed-url',
    { track_id: track.id },
  )
  if (url.startsWith('mock://')) return LOCAL_TEST_AUDIO_URI
  if (/^https?:\/\//.test(url)) return url
  // Phase 3: prepend apiBase and pass the bearer as AudioSource.headers.
  return `${services.config.apiBaseUrl}${url}`
}
