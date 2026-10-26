export interface ApiClient {
    get<T>(path: string, params?: Record<string, unknown>): Promise<T>
    post<T>(path: string, body?: unknown, opts?: { bare?: boolean }): Promise<T>
    put<T>(path: string, body?: unknown): Promise<T>
    patch<T>(path: string, body?: unknown): Promise<T>
    delete<T = void>(path: string): Promise<T>
}