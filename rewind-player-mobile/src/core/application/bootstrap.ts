// src/core/application/bootstrap.ts
import { ApiError } from '../domain/errors'
import type { ApiClient } from '../ports/apiClient'
import type { AuthGateway } from '../ports/authGateway'
import type { DeviceInfo } from '../ports/deviceInfo'
import type { KeyValueStore } from '../ports/keyValueStore'
import type { MarketplaceGateway } from '../ports/marketplaceGateway'
import { listDevices, registerDevice } from './devices'

/** §5.4: the marketplace provision retry runs at most once per app session. */
export const PROVISION_ATTEMPTED_KEY = 'auth.provision_attempted'

/** §3.1 — the /users/me response has no name/avatar fields. */
export interface ApiUser {
    id: string
    keycloak_id: string
    email: string
    subscription_tier: string
    created_at: string
    updated_at: string
}

export interface AuthUser {
    /** null when the user is only known from token claims (blocked). */
    id: string | null
    keycloakId: string | null
    email: string | null
    name: string | null
}

export type BootstrapStatus = 'authenticating' | 'blocked' | 'error' | 'ready'

export interface BootstrapResult {
    status: BootstrapStatus
    user: AuthUser | null
    deviceId: string | null
    authError: string | null
}

export interface BootstrapDeps {
    auth: AuthGateway
    api: ApiClient
    store: KeyValueStore
    marketplace: MarketplaceGateway
    deviceInfo: DeviceInfo
}

/**
 * §5.4 bootstrap sequence, exact order:
 *   initAuth → GET /users/me → (403 ⇒ provision once, retry once) →
 *   blocked state or → GET /devices/ (register when empty) → ready.
 * Favorites load best-effort (§5.4 step 4) lives in the feature layer.
 */
export async function bootstrap(deps: BootstrapDeps): Promise<BootstrapResult> {
    // Step 1 — initAuth. The adapter memoizes init; false ⇒ login declined.
    let authed: boolean
    try {
        authed = await deps.auth.init()
    } catch (err) {
        return {
            status: 'error',
            user: null,
            deviceId: null,
            authError:
                err instanceof Error ? err.message : 'Authentication init failed',
        }
    }
    if (!authed) {
        return { status: 'authenticating', user: null, deviceId: null, authError: null }
    }

    // Step 2 — /users/me with the once-per-session provision retry.
    const resolved = await resolveUser(deps)
    if (resolved.status === 'blocked') {
        return {
            status: 'blocked',
            user: fallbackUser(deps.auth.getTokenClaims()),
            deviceId: null,
            authError: 'Account unavailable — not provisioned',
        }
    }
    if (resolved.status === 'error') {
        return {
            status: 'error',
            user: null,
            deviceId: null,
            authError: resolved.message,
        }
    }
    const user = resolved.user

    // Step 3 — ensure a device exists for this installation.
    try {
        const devices = await listDevices(deps.api)
        const deviceId =
            devices.length > 0
                ? devices[0]!.id
                : (await registerDevice(deps.api, deps.deviceInfo)).id
        return { status: 'ready', user, deviceId, authError: null }
    } catch (err) {
        return {
            status: 'error',
            user: null,
            deviceId: null,
            authError:
                err instanceof Error
                    ? `Could not prepare this device — ${err.message}`
                    : 'Could not prepare this device',
        }
    }
}

type ResolvedUser =
    | { status: 'ok'; user: AuthUser }
    | { status: 'blocked' }
    | { status: 'error'; message: string }

async function resolveUser(deps: BootstrapDeps): Promise<ResolvedUser> {
    const { api, auth, store, marketplace } = deps

    try {
        const me = await api.get<ApiUser>('/users/me')
        return { status: 'ok', user: toAuthUser(me) }
    } catch (err) {
        if (!ApiError.isAccessDenied(err)) {
            return {
                status: 'error',
                message:
                    err instanceof Error ? err.message : 'Could not reach the server',
            }
        }
    }

    // 403: the Keycloak user has no player-DB row. Provision once per app
    // session (marketplace webhook may have missed the signup), retry once.
    if (store.get(PROVISION_ATTEMPTED_KEY) === '1') return { status: 'blocked' }
    store.set(PROVISION_ATTEMPTED_KEY, '1')

    const token = await auth.getToken()
    if (!token) return { status: 'blocked' }
    try {
        await marketplace.provisionPlayer(token)
    } catch {
        return { status: 'blocked' }
    }

    try {
        const me = await api.get<ApiUser>('/users/me')
        return { status: 'ok', user: toAuthUser(me) }
    } catch (err) {
        if (ApiError.isAccessDenied(err)) return { status: 'blocked' }
        return {
            status: 'error',
            message:
                err instanceof Error ? err.message : 'Could not reach the server',
        }
    }
}

function toAuthUser(apiUser: ApiUser): AuthUser {
    return {
        id: apiUser.id,
        keycloakId: apiUser.keycloak_id,
        email: apiUser.email,
        name: null,
    }
}

/** §5.4 blocked state: build the fallback user from Keycloak token claims. */
function fallbackUser(claims: Record<string, unknown> | null): AuthUser {
    const str = (v: unknown): string | null => (typeof v === 'string' ? v : null)
    return {
        id: null,
        keycloakId: str(claims?.sub),
        email: str(claims?.email),
        name: str(claims?.name) ?? str(claims?.preferred_username) ?? 'Unprovisioned user',
    }
}

/** §3.1 display-name rule: name ?? email prefix ?? 'Account'. */
export function displayName(user: AuthUser | null): string {
    if (!user) return 'Account'
    if (user.name && user.name.trim() !== '') return user.name
    const prefix = user.email?.split('@')[0]?.trim()
    return prefix && prefix !== '' ? prefix : 'Account'
}
