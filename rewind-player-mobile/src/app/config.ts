// src/app/config.ts
import type { AppConfig, KeycloakConfig } from '../core/domain/config'

export type { AppConfig, KeycloakConfig }

const DEFAULT_API_BASE_URL = 'http://localhost:8000/api/v1'
/** Hardcoded fallback per spec §2. */
const DEFAULT_MARKETPLACE_URL = 'https://market.rewind-music.com'

// Expo statically inlines `process.env.EXPO_PUBLIC_*`, so each key must be
// written out literally — no `process.env[key]` lookups.
function readKeycloakConfig(): KeycloakConfig | null {
    const url = process.env.EXPO_PUBLIC_KEYCLOAK_URL
    const realm = process.env.EXPO_PUBLIC_KEYCLOAK_REALM
    const clientId = process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_ID
    if (!url || !realm || !clientId) return null
    return { url, realm, clientId }
}

export function loadConfig(): AppConfig {
    return {
        apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL,
        keycloak: readKeycloakConfig(),
        marketplaceUrl: process.env.EXPO_PUBLIC_MARKETPLACE_URL || DEFAULT_MARKETPLACE_URL,
    }
}