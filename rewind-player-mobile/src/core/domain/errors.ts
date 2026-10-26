/**
 * Typed error thrown by the ApiClient adapter. Use-cases catch it where the
 * spec distinguishes status codes — e.g. §3.8: 403 on signed-url means
 * "purchase required", not a generic failure.
 */
export class ApiError extends Error {
    readonly status: number
    readonly body?: unknown

    constructor(status: number, message: string, body?: unknown) {
        super(message)
        this.name = 'ApiError'
        this.status = status
        this.body = body
    }

    static isAccessDenied(error: unknown): error is ApiError {
        return error instanceof ApiError && error.status === 403
    }

    static isNotFound(error: unknown): error is ApiError {
        return error instanceof ApiError && error.status === 404
    }
}