export interface AuthGateway {
    init(): Promise<boolean>
    isAuthenticated(): boolean
    getToken(): Promise<string | null>
    login(): Promise<void>
    logout(): Promise<void>
    getTokenClaims(): Record<string, unknown> | null
}