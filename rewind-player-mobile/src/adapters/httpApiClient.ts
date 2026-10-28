// src/adapters/httpApiClient.ts
import { create, isAxiosError } from 'axios'
import { ApiError } from '../core/domain/errors'
import type { ApiClient } from '../core/ports/apiClient'
import type { AuthGateway } from '../core/ports/authGateway'

export interface HttpApiClientDeps {
    baseUrl: string
    auth: AuthGateway
}

/**
 * Real ApiClient over axios (§3 API contract).
 *
 * §5.2 token handling: refresh before every request (auth.getToken already
 * refreshes silently); a 401 response drives re-login through the adapter's
 * single-flight login() and the request is retried once (GETs only — never
 * re-send mutations). HTTP errors are normalized into ApiError so the
 * use-cases keep their status-based branching (403 ⇒ purchase prompt, etc).
 */
export function createHttpApiClient(deps: HttpApiClientDeps): ApiClient {
    const client = create({ baseURL: deps.baseUrl, timeout: 15_000 })

    async function attachHeaders(): Promise<Record<string, string>> {
        const token = await deps.auth.getToken()
        return token ? { Authorization: `Bearer ${token}` } : {}
    }

    function toApiError(err: unknown): Error {
        if (isAxiosError(err) && err.response) {
            const status = err.response.status
            const data = err.response.data as
                | { detail?: string; message?: string }
                | string
                | undefined
            const message =
                typeof data === 'string'
                    ? data
                    : (data?.detail ?? data?.message ?? err.message)
            return new ApiError(status, message, err.response.data)
        }
        if (err instanceof Error) return err
        return new Error(String(err))
    }

    async function request<T>(
        method: 'get' | 'post' | 'put' | 'patch' | 'delete',
        path: string,
        body?: unknown,
        params?: Record<string, unknown>,
        bare = false,
    ): Promise<T> {
        const run = async (): Promise<T> => {
            const headers = bare ? {} : await attachHeaders()
            const response = await client.request({
                method,
                url: path,
                params,
                data: body,
                headers,
            })
            return response.data as T
        }

        try {
            return await run()
        } catch (err) {
            if (!bare && isAxiosError(err) && err.response?.status === 401) {
                // §5.2: 401 drives re-login — the adapter's login() is
                // single-flight, so rapid 401s open exactly one login window.
                try {
                    await deps.auth.login()
                } catch {
                    // fall through to the original error
                }
                // Retry reads once with the fresh token; never re-send
                // mutations (a repeated POST could double-create).
                if (method === 'get' && deps.auth.isAuthenticated()) {
                    return run()
                }
            }
            throw toApiError(err)
        }
    }

    return {
        get: (path, params) => request('get', path, undefined, params),
        post: (path, body, opts) =>
            request('post', path, body, undefined, opts?.bare),
        put: (path, body) => request('put', path, body),
        patch: (path, body) => request('patch', path, body),
        delete: (path) => request('delete', path),
    }
}
