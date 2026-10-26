// src/core/application/services.ts
import type { ApiClient } from '../ports/apiClient'
import type { NormalizeOptions } from '../domain/normalize'
import type { AppConfig } from '../domain/config'
import type { FavoritesUseCases } from './favorites'

/**
 * Aggregate of ports and use-cases that the composition root wires up and
 * injects into the UI. Kept in core so both `app` (wiring) and `features`
 * (consumption) can depend on it without reaching into each other.
 */
export interface Services {
    config: AppConfig
    api: ApiClient
    normalizeOpts: NormalizeOptions
    favorites: FavoritesUseCases
}
