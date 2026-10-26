// Phase 1 will port playback orchestration here.
/**
 * Milliseconds → 'm:ss', or 'h:mm:ss' once the duration reaches an hour.
 * Falsy, negative, or non-finite input renders '0:00' (the "0" case in §4).
 */
export function formatTime(ms: number | null | undefined): string {
    if (!ms || !Number.isFinite(ms) || ms < 0) return '0:00'

    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    const ss = String(seconds).padStart(2, '0')

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${ss}`
    }
    return `${minutes}:${ss}`
}