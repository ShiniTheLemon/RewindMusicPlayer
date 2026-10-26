export interface AudioEngineCallbacks {
    onPlay(): void
    onEnd(): void
    onError(error: unknown): void
    onSeeked(): void
}

export interface AudioEngine {
    play(
        url: string,
        trackId: string,
        callbacks: AudioEngineCallbacks,
        headers?: Record<string, string>,
    ): void
    pause(): void
    resume(): void
    seek(positionMs: number): void
    getCurrentTimeMs(): number
    setVolume(percent: number): void
    isPlaying(): boolean
    destroy(): void
}