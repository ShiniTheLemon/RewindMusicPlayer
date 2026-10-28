// src/core/ports/marketplaceGateway.ts

/** §3.9: the marketplace is a separate host reached directly with the bearer token. */
export interface MarketplaceGateway {
    /**
     * §5.4: ask the marketplace to provision the player-DB user row. Called
     * once per app session when /users/me returns 403.
     */
    provisionPlayer(token: string): Promise<void>
}
