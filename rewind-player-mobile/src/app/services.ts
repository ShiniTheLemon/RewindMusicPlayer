// src/app/services.ts
import { createFavorites } from '../core/application/favorites'
import type { Services } from '../core/application/services'
import type { AppConfig } from '../core/domain/config'
import type { NormalizeOptions } from '../core/domain/normalize'
import type { Track } from '../core/domain/entities'
import { createHttpApiClient } from '../adapters/httpApiClient'
import { createExpoAudioEngine } from '../adapters/expoAudioEngine'
import { createDeviceMusicSource } from '../adapters/deviceMusic'
import { createKeycloakAuth, createDisabledAuth } from '../adapters/keycloakAuth'
import { createMmkvKeyValueStore } from '../adapters/mmkvKeyValue'
import { createMarketplaceGateway } from '../adapters/marketplaceHttp'
import type { BootstrapDeps } from '../core/application/bootstrap'
import { installPlaybackDeps } from '../features/playback/playbackStore'
import { installAuthDeps } from '../features/auth/authStore'

// Bundled placeholder injected into normalize(). If your scaffold puts assets
// somewhere other than assets/, fix this path — the compiler will not
// catch it because require() is untyped.
const STATIC_COVER = require('../../assets/icon.png') as number

// Default artist avatar when profile_pic_path is missing.
const STATIC_AVATAR = require('../../assets/avatar.png') as number

export function createServices(config: AppConfig): Services {
  const keyValue = createMmkvKeyValueStore()
  const auth = config.keycloak
    ? createKeycloakAuth(config.keycloak, keyValue)
    : createDisabledAuth()

  // Phase 3: the real backend. The mock (createMockApiClient) remains for
  // tests and device-less demos.
  const api = createHttpApiClient({ baseUrl: config.apiBaseUrl, auth })

  const normalizeOpts: NormalizeOptions = {
    apiBase: config.apiBaseUrl,
    staticCover: STATIC_COVER,
    staticAvatar: STATIC_AVATAR,
  }
  const favorites = createFavorites({ api, normalizeOpts })

  const bootstrapDeps: BootstrapDeps = {
    auth,
    api,
    store: keyValue,
    marketplace: createMarketplaceGateway(config.marketplaceUrl),
    // §5.4: the RN client registers itself as a mobile device, audio-only.
    deviceInfo: { deviceType: 'mobile', capabilities: { audio: true, hls: false } },
  }

  const services: Services = {
    config,
    api,
    normalizeOpts,
    favorites,
    deviceMusic: createDeviceMusicSource(),
    auth,
    keyValue,
    bootstrapDeps,
  }

  installPlaybackDeps({
    engine: createExpoAudioEngine(),
    resolveUrl: (track: Track) => resolvePlaybackUrl(services, track),
  })

  installAuthDeps(bootstrapDeps)

  return services
}

/**
 * §3.8 URL resolution:
 *   - device-local tracks carry their URI from enumeration time
 *   - https presigned URL → play directly (tokenless, range-capable)
 *   - relative /playback/stream/{id} (legacy tracks) → play with the bearer
 *     as an HTTP header — RN has no blob URLs, and expo-audio forwards
 *     AudioSource.headers to the request
 * A 403 from signed-url is thrown as ApiError(403) so the store opens the
 * purchase prompt (§6.1).
 */
async function resolvePlaybackUrl(
  services: Services,
  track: Track,
): Promise<{ url: string; headers?: Record<string, string> }> {
  if (track.id.startsWith('local:')) {
    if (!track.url) {
      throw new Error('This track is DRM-protected and cannot be played')
    }
    return { url: track.url }
  }

  const { url } = await services.api.get<{ url: string }>(
    '/playback/signed-url',
    { track_id: track.id },
  )
  console.log('[playback] signed-url answered for', track.id, '→', JSON.stringify(url))
  if (/^https?:\/\//.test(url)) return { url }

  const token = await services.auth.getToken()
  return {
    url: `${services.config.apiBaseUrl}${url}`,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  }
}
