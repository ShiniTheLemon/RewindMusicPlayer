// src/core/domain/config.ts
export interface KeycloakConfig {
    url: string
    realm: string
    clientId: string
}

export interface AppConfig {
    /** Includes the `/api/v1` prefix. */
    apiBaseUrl: string
    /** null when any of the three Keycloak vars is missing (spec §2). */
    keycloak: KeycloakConfig | null
    marketplaceUrl: string
}
