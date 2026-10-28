// src/adapters/keycloakAuth.ts
import {
  AuthRequest,
  exchangeCodeAsync,
  fetchDiscoveryAsync,
  makeRedirectUri,
  TokenResponse,
  type AuthSessionResult,
  type DiscoveryDocument,
} from 'expo-auth-session'
import * as Linking from 'expo-linking'
import type { AuthGateway } from '../core/ports/authGateway'
import type { KeyValueStore } from '../core/ports/keyValueStore'
import type { KeycloakConfig } from '../core/domain/config'

/**
 * AuthGateway backed by Keycloak's OIDC endpoints, driven with
 * expo-auth-session (PKCE + system browser + app-scheme redirect).
 *
 * keycloak-js 26.2.4 ships no React Native entry point (contrary to the
 * spec's §5.3 assumption), so this replaces the keycloak-js adapter while
 * keeping the exact AuthGateway contract — the spec's fallback clause.
 *
 * Browser resolution: Custom Tabs first (generic, then pinned known
 * browsers), then a plain ACTION_VIEW open with manual deep-link capture.
 *
 * Tokens live in the KeyValueStore. refresh_token comes from the
 * `offline_access` scope; getToken() refreshes silently and soft-fails
 * offline (the 401 interceptor in Phase 3 drives re-login).
 */

const TOKENS_KEY = 'auth.tokens'
const REDIRECT_PATH = 'login'
const REFRESH_MARGIN_MS = 30_000
const PLAIN_BROWSER_TIMEOUT_MS = 3 * 60_000
/** How long to wait for a browser to actually open before trying the next option. */
const PROMPT_OPEN_TIMEOUT_MS = 15_000

/** Known Custom Tabs browsers, tried when generic resolution fails. */
const BROWSER_CANDIDATES = [
  'com.microsoft.emmx', // Edge
  'com.android.chrome', // Chrome
  'org.mozilla.firefox', // Firefox
  'com.sec.android.app.sbrowser', // Samsung Internet
  'com.opera.browser', // Opera
]

const log = (...args: unknown[]) => console.log('[keycloakAuth]', ...args)

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out after ${ms}ms (${label})`)),
      ms,
    )
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err: unknown) => {
        clearTimeout(timer)
        reject(err)
      },
    )
  })
}

function describeError(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}`
  return String(err)
}

interface StoredTokens {
  accessToken: string
  refreshToken: string | null
  idToken: string | null
  /** Seconds. */
  expiresIn: number
  /** Unix seconds. */
  issuedAt: number
}

type PromptOutcome =
  | { type: 'success'; code: string }
  | { type: 'incomplete' }
  | { type: 'error'; message: string }

export function createKeycloakAuth(
  config: KeycloakConfig,
  store: KeyValueStore,
): AuthGateway {
  const issuer = `${config.url}/realms/${config.realm}`
  const redirectUri = makeRedirectUri({
    scheme: 'rewindplayer',
    path: REDIRECT_PATH,
  })
  const scopes = ['openid', 'profile', 'email', 'offline_access']

  // §5.1: one init per app lifetime (reset after login/logout).
  let initPromise: Promise<boolean> | null = null
  // Edge case (§5.3): rapid re-login requests must not stack logins.
  let loginPromise: Promise<void> | null = null

  function readTokens(): StoredTokens | null {
    const raw = store.get(TOKENS_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as StoredTokens
    } catch {
      return null
    }
  }

  function persistTokens(tokens: StoredTokens): void {
    store.set(TOKENS_KEY, JSON.stringify(tokens))
  }

  function clearTokens(): void {
    store.remove(TOKENS_KEY)
  }

  function toStored(tokens: TokenResponse): StoredTokens {
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? null,
      idToken: tokens.idToken ?? null,
      expiresIn: tokens.expiresIn ?? 300,
      issuedAt: tokens.issuedAt ?? Math.floor(Date.now() / 1000),
    }
  }

  function isFresh(stored: StoredTokens): boolean {
    const expiresAt = (stored.issuedAt + stored.expiresIn) * 1000
    return expiresAt > Date.now() + REFRESH_MARGIN_MS
  }

  async function getDiscovery(): Promise<DiscoveryDocument | null> {
    try {
      return await fetchDiscoveryAsync(issuer)
    } catch {
      return null
    }
  }

  /** Silent refresh; soft-fails offline (§5.3 edge case 2). */
  async function refreshTokens(
    stored: StoredTokens,
  ): Promise<StoredTokens | null> {
    if (!stored.refreshToken) return null
    try {
      const discovery = await getDiscovery()
      if (!discovery?.tokenEndpoint) return null
      const refreshed = await new TokenResponse({
        accessToken: stored.accessToken,
        refreshToken: stored.refreshToken,
        idToken: stored.idToken ?? undefined,
        expiresIn: stored.expiresIn,
        issuedAt: stored.issuedAt,
      }).refreshAsync({ clientId: config.clientId }, discovery)
      const next = toStored(refreshed)
      persistTokens(next)
      return next
    } catch {
      return null
    }
  }

  function isNoBrowserError(err: unknown): boolean {
    const message = err instanceof Error ? err.message : String(err)
    return /no matching browser activity/i.test(message)
  }

  function toOutcome(result: AuthSessionResult): PromptOutcome {
    if (result.type === 'success' && result.params.code) {
      return { type: 'success', code: result.params.code }
    }
    return { type: 'incomplete' }
  }

  async function promptForCode(
    request: AuthRequest,
    discovery: DiscoveryDocument,
  ): Promise<PromptOutcome> {
    log('attempt 1/6: generic Custom Tabs')
    try {
      const result = await withTimeout(
        request.promptAsync(discovery),
        PROMPT_OPEN_TIMEOUT_MS,
        'generic',
      )
      log('attempt 1 result:', result.type)
      return toOutcome(result)
    } catch (err) {
      log('attempt 1 failed:', describeError(err))
      if (!isNoBrowserError(err)) throw err
    }

    // Custom Tabs resolution failed even though a browser exists — pin
    // known browsers one by one, then fall back to a plain browser open.
    for (const pkg of BROWSER_CANDIDATES) {
      log(`attempt: pinned browser ${pkg}`)
      try {
        const result = await withTimeout(
          request.promptAsync(discovery, { browserPackage: pkg }),
          PROMPT_OPEN_TIMEOUT_MS,
          pkg,
        )
        log(`attempt ${pkg} result:`, result.type)
        // 'dismiss' means the user closed a real browser window — final.
        if (result.type === 'dismiss') return toOutcome(result)
        // Anything else without a code: the browser likely never opened.
        log(`attempt ${pkg}: no browser window (${result.type}) — trying next`)
      } catch (err) {
        log(`attempt ${pkg} failed:`, describeError(err))
      }
    }

    log('fallback: plain browser open via Linking')
    return promptViaPlainBrowser(request, discovery)
  }

  /** Last resort: ACTION_VIEW open + manual capture of the scheme deep link. */
  function promptViaPlainBrowser(
    request: AuthRequest,
    discovery: DiscoveryDocument,
  ): Promise<PromptOutcome> {
    return request.makeAuthUrlAsync(discovery).then(
      (authUrl) =>
        new Promise<PromptOutcome>((resolve) => {
          log('plain browser: opening auth URL via Linking.openURL')
          let timer: ReturnType<typeof setTimeout> | null = null
          let settled = false

          const finish = (outcome: PromptOutcome) => {
            if (settled) return
            settled = true
            if (timer) clearTimeout(timer)
            subscription.remove()
            log('plain browser: finished with', outcome.type)
            resolve(outcome)
          }

          const subscription = Linking.addEventListener('url', ({ url }) => {
            log('plain browser: deep link received:', url)
            if (!url.startsWith(redirectUri)) return
            const parsed = Linking.parse(url)
            const code =
              typeof parsed.queryParams?.code === 'string'
                ? parsed.queryParams.code
                : null
            finish(code ? { type: 'success', code } : { type: 'incomplete' })
          })

          timer = setTimeout(() => {
            log('plain browser: timed out waiting for the redirect')
            finish({ type: 'incomplete' })
          }, PLAIN_BROWSER_TIMEOUT_MS)

          Linking.openURL(authUrl)
            .then(() => log('plain browser: openURL resolved OK'))
            .catch((err: unknown) => {
              log('plain browser: openURL failed:', describeError(err))
              finish({
                type: 'error',
                message:
                  'No browser is available on this device — install Chrome (or any browser) to sign in.',
              })
            })
        }),
    )
  }

  return {
    async init(): Promise<boolean> {
      if (initPromise) return initPromise
      initPromise = (async () => {
        const stored = readTokens()
        log('init:', stored ? 'stored tokens found' : 'no stored tokens')
        if (!stored) return false
        if (isFresh(stored)) return true
        const refreshed = await refreshTokens(stored)
        log('init: silent refresh', refreshed ? 'succeeded' : 'failed')
        return refreshed !== null
      })()
      return initPromise
    },

    isAuthenticated(): boolean {
      return readTokens() !== null
    },

    async getToken(): Promise<string | null> {
      let stored = readTokens()
      if (!stored) return null
      if (!isFresh(stored)) {
        stored = await refreshTokens(stored)
        if (!stored) {
          clearTokens()
          return null
        }
      }
      return stored.accessToken
    },

    async login(): Promise<void> {
      if (loginPromise) return loginPromise
      loginPromise = (async () => {
        log('login: starting, issuer =', issuer, 'redirectUri =', redirectUri)
        const discovery = await getDiscovery()
        if (!discovery) throw new Error('Could not reach the Keycloak server')
        if (!discovery.authorizationEndpoint) {
          // Keycloak answers 404 {"error":"Realm does not exist"} for unknown
          // realms — expo-auth-session parses it into an empty doc instead of
          // throwing. Fail loudly here with the real cause.
          throw new Error(
            `Keycloak realm "${config.realm}" was not found on ${config.url} — create it in the admin console (or fix EXPO_PUBLIC_KEYCLOAK_REALM).`,
          )
        }
        log('login: discovery OK —', discovery.authorizationEndpoint)

        const request = new AuthRequest({
          clientId: config.clientId,
          redirectUri,
          scopes,
          usePKCE: true,
        })

        const outcome = await promptForCode(request, discovery)
        log('login: prompt outcome =', outcome.type)
        if (outcome.type === 'incomplete') return
        if (outcome.type === 'error') throw new Error(outcome.message)

        // PKCE: the verifier must ride along in extraParams — the exchange
        // helper has no dedicated field for it.
        if (!request.codeVerifier) throw new Error('PKCE setup failed')
        log('login: exchanging code for tokens')
        const tokens = await exchangeCodeAsync(
          {
            code: outcome.code,
            clientId: config.clientId,
            redirectUri,
            extraParams: {
              client_id: config.clientId,
              code_verifier: request.codeVerifier,
            },
          },
          discovery,
        )
        log('login: token exchange succeeded')
        persistTokens(toStored(tokens))
        initPromise = null // next init() re-evaluates the fresh tokens
      })().finally(() => {
        log('login: flow finished')
        loginPromise = null
      })
      return loginPromise
    },

    async logout(): Promise<void> {
      // Local clear is the effective logout for a PKCE public client; the
      // Keycloak SSO cookie survives so the next login stays silent.
      clearTokens()
      initPromise = null
    },

    getTokenClaims(): Record<string, unknown> | null {
      const stored = readTokens()
      if (!stored?.idToken) return null
      try {
        const payload = stored.idToken.split('.')[1]
        if (!payload) return null
        return JSON.parse(decodeBase64Url(payload)) as Record<string, unknown>
      } catch {
        return null
      }
    },
  }
}

/** AuthGateway used when EXPO_PUBLIC_KEYCLOAK_* is missing — bootstrap surfaces it as an error. */
export function createDisabledAuth(): AuthGateway {
  const fail = async (): Promise<never> => {
    throw new Error(
      'Keycloak is not configured — set EXPO_PUBLIC_KEYCLOAK_* in .env',
    )
  }
  return {
    init: fail,
    isAuthenticated: () => false,
    getToken: async () => null,
    login: fail,
    logout: async () => undefined,
    getTokenClaims: () => null,
  }
}

function decodeBase64Url(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  if (typeof atob === 'function') return atob(padded)
  throw new Error('atob unavailable in this runtime')
}
