// src/adapters/marketplaceHttp.ts
import axios from 'axios'
import type { MarketplaceGateway } from '../core/ports/marketplaceGateway'

/** §3.9: the marketplace is a separate host reached directly with the bearer token. */
export function createMarketplaceGateway(baseUrl: string): MarketplaceGateway {
  return {
    async provisionPlayer(token: string): Promise<void> {
      await axios.post(`${baseUrl}/api/v1/auth/player-provision`, null, {
        headers: { Authorization: `Bearer ${token}` },
      })
    },
  }
}
