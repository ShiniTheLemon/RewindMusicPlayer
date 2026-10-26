// Phase 1 will port playback orchestration here.
import type { Track } from './entities'

/* ------------------------------------------------------------------ */
/* State (§6.1)                                                        */
/* ------------------------------------------------------------------ */

export interface PlaybackState {
    currentTrack: Track | null
    isPlaying: boolean
    /** Milliseconds. */
    currentTime: number
    /** 0–100. Default 80. */
    volume: number
    isMuted: boolean
    queue: Track[]
    /** Most recently started first. */
    history: Track[]
    shuffle: boolean
    repeat: boolean
    buffering: boolean
    purchasePrompt: { track: Track } | null
}

export const INITIAL_PLAYBACK_STATE: PlaybackState = {
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    volume: 80,
    isMuted: false,
    queue: [],
    history: [],
    shuffle: false,
    repeat: false,
    buffering: false,
    purchasePrompt: null,
}

/* ------------------------------------------------------------------ */
/* Effects — data only; core never performs them                       */
/* ------------------------------------------------------------------ */

export type PlaybackEffect =
    /** Resolve the track's URL and start audio. Failure dispatches LOAD_DENIED. */
    | { type: 'LOAD_TRACK'; track: Track }
    | { type: 'DESTROY_AUDIO' }
    | { type: 'PAUSE_AUDIO' }
    | { type: 'RESUME_AUDIO' }
    | { type: 'SEEK_AUDIO'; positionMs: number }
    | { type: 'SET_ENGINE_VOLUME'; volume: number }
    | { type: 'START_TIME_SYNC' }
    | { type: 'STOP_TIME_SYNC' }
    | { type: 'START_SESSION'; track: Track }
    /** Idempotent: interpret as "if a session id is held, POST end and clear it". */
    | { type: 'END_SESSION' }

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

export type PlaybackAction =
    /** User pressed play on a track. Does not change currentTrack yet. */
    | { type: 'PLAY'; track: Track }
    /** The application layer resolved a URL; audio is about to start. */
    | { type: 'TRACK_LOADED'; track: Track }
    /** URL resolution returned 403 — show the purchase prompt, keep old state. */
    | { type: 'LOAD_DENIED'; track: Track }
    | { type: 'DISMISS_PURCHASE_PROMPT' }
    /** Engine onPlay callback. */
    | { type: 'TRACK_STARTED' }
    /** Engine onEnd callback. */
    | { type: 'TRACK_ENDED' }
    /** Engine onError callback. */
    | { type: 'TRACK_ERROR' }
    /** Engine onSeeked callback. */
    | { type: 'SEEKED' }
    | { type: 'PAUSE' }
    | { type: 'RESUME' }
    | { type: 'SEEK'; positionMs: number }
    | { type: 'NEXT' }
    | { type: 'PREVIOUS' }
    | { type: 'SET_VOLUME'; volume: number }
    | { type: 'TOGGLE_MUTE' }
    | { type: 'ADD_TO_QUEUE'; track: Track }
    | { type: 'CLEAR_QUEUE' }
    | { type: 'SET_QUEUE'; tracks: Track[] }
    | { type: 'TOGGLE_SHUFFLE' }
    | { type: 'TOGGLE_REPEAT' }
    /** Teardown (§6.1 step 7). */
    | { type: 'STOP' }

export interface PlaybackTransition {
    state: PlaybackState
    effects: PlaybackEffect[]
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function effectiveVolume(state: PlaybackState): number {
    return state.isMuted ? 0 : state.volume
}

function clampVolume(value: number): number {
    if (!Number.isFinite(value)) return 0
    return Math.min(100, Math.max(0, Math.round(value)))
}

function clampPosition(positionMs: number, track: Track | null): number {
    if (!Number.isFinite(positionMs) || positionMs < 0) return 0
    const duration = track?.duration ?? 0
    return duration > 0 ? Math.min(positionMs, duration) : positionMs
}

const unchanged = (state: PlaybackState): PlaybackTransition => ({
    state,
    effects: [],
})

/* ------------------------------------------------------------------ */
/* Reducer                                                             */
/* ------------------------------------------------------------------ */

export function playbackReducer(
    state: PlaybackState,
    action: PlaybackAction,
): PlaybackTransition {
    switch (action.type) {
        /**
         * §6.1 step 1: URL resolution happens in the application layer, *before*
         * anything is torn down. PLAY therefore only requests the load and clears a
         * stale prompt; a 403 arrives as LOAD_DENIED and leaves the player intact.
         */
        case 'PLAY': {
            if (!action.track.id) return unchanged(state)
            return {
                state: { ...state, purchasePrompt: null },
                effects: [{ type: 'LOAD_TRACK', track: action.track }],
            }
        }

        /** §6.1 step 2: destroy the previous audio, stop sync, swap the track. */
        case 'TRACK_LOADED': {
            return {
                state: {
                    ...state,
                    currentTrack: action.track,
                    currentTime: 0,
                    isPlaying: false,
                    buffering: true,
                    purchasePrompt: null,
                },
                effects: [
                    { type: 'STOP_TIME_SYNC' },
                    { type: 'DESTROY_AUDIO' },
                    { type: 'END_SESSION' },
                ],
            }
        }

        case 'LOAD_DENIED': {
            return {
                state: {
                    ...state,
                    purchasePrompt: { track: action.track },
                    buffering: false,
                    isPlaying: false,
                },
                effects: [],
            }
        }

        case 'DISMISS_PURCHASE_PROMPT':
            return { state: { ...state, purchasePrompt: null }, effects: [] }

        /** §6.1 step 3, onPlay. */
        case 'TRACK_STARTED': {
            const track = state.currentTrack
            if (!track) return unchanged(state)

            // Resume vs. fresh play: on RESUME the engine re-fires onPlay, but
            // the track is already at the top of history. Detect via
            // history[0].id. §6.1 step 4 expects onPlay on resume; the reducer
            // must treat it as a state transition, not a new play.
            const isResume = state.history[0]?.id === track.id

            const effects: PlaybackEffect[] = [
                { type: 'START_TIME_SYNC' },
                { type: 'SET_ENGINE_VOLUME', volume: effectiveVolume(state) },
            ]
            if (!isResume) effects.push({ type: 'START_SESSION', track })

            return {
                state: {
                    ...state,
                    isPlaying: true,
                    buffering: false,
                    history: isResume ? state.history : [track, ...state.history],
                },
                effects,
            }
        }

        /** §6.1 step 3, onEnd. Repeat wins over the queue. */
        case 'TRACK_ENDED': {
            const base: PlaybackState = {
                ...state,
                isPlaying: false,
                currentTime: 0,
                buffering: false,
            }
            const stopSync: PlaybackEffect = { type: 'STOP_TIME_SYNC' }

            if (state.repeat && state.currentTrack) {
                return {
                    state: base,
                    effects: [stopSync, { type: 'LOAD_TRACK', track: state.currentTrack }],
                }
            }

            const [next, ...rest] = state.queue
            if (next) {
                return {
                    state: { ...base, queue: rest },
                    effects: [stopSync, { type: 'LOAD_TRACK', track: next }],
                }
            }

            return { state: base, effects: [stopSync, { type: 'END_SESSION' }] }
        }

        /** §6.1 step 3, onError. */
        case 'TRACK_ERROR':
            return {
                state: { ...state, isPlaying: false, buffering: false },
                effects: [{ type: 'STOP_TIME_SYNC' }],
            }

        /** §6.1 step 3, onSeeked. */
        case 'SEEKED':
            return { state: { ...state, buffering: false }, effects: [] }

        case 'PAUSE': {
            if (!state.currentTrack) return unchanged(state)
            return {
                state: { ...state, isPlaying: false },
                effects: [{ type: 'PAUSE_AUDIO' }, { type: 'STOP_TIME_SYNC' }],
            }
        }

        /**
         * §6.1 step 4. isPlaying flips when the engine re-fires onPlay
         * (TRACK_STARTED); this action only raises the buffering flag.
         */
        case 'RESUME': {
            if (!state.currentTrack) return unchanged(state)
            return {
                state: { ...state, buffering: true },
                effects: [{ type: 'RESUME_AUDIO' }, { type: 'START_TIME_SYNC' }],
            }
        }

        /** §6.1 step 4: currentTime is set immediately; the engine is the authority. */
        case 'SEEK': {
            if (!state.currentTrack) return unchanged(state)
            const positionMs = clampPosition(action.positionMs, state.currentTrack)
            return {
                state: { ...state, buffering: true, currentTime: positionMs },
                effects: [{ type: 'SEEK_AUDIO', positionMs }],
            }
        }

        /** §6.1 step 5. */
        case 'NEXT': {
            const [next, ...rest] = state.queue
            if (next) {
                return {
                    state: { ...state, queue: rest, isPlaying: false },
                    effects: [
                        { type: 'STOP_TIME_SYNC' },
                        { type: 'LOAD_TRACK', track: next },
                    ],
                }
            }
            if (state.repeat && state.currentTrack) {
                return {
                    state: { ...state, isPlaying: false },
                    effects: [
                        { type: 'STOP_TIME_SYNC' },
                        { type: 'LOAD_TRACK', track: state.currentTrack },
                    ],
                }
            }
            return unchanged(state)
        }

        /**
         * §6.1 step 5. Ported literally: history[1] only exists once two tracks
         * have started, and the replay re-unshifts, so previous() ping-pongs
         * between the last two tracks. That is the predecessor's behaviour.
         */
        case 'PREVIOUS': {
            const target = state.history.length > 1 ? state.history[1] : undefined
            if (target) {
                return {
                    state: { ...state, isPlaying: false },
                    effects: [
                        { type: 'STOP_TIME_SYNC' },
                        { type: 'LOAD_TRACK', track: target },
                    ],
                }
            }
            if (state.repeat && state.currentTrack) {
                return {
                    state: { ...state, isPlaying: false },
                    effects: [
                        { type: 'STOP_TIME_SYNC' },
                        { type: 'LOAD_TRACK', track: state.currentTrack },
                    ],
                }
            }
            return unchanged(state)
        }

        /** §6.1 step 6: 0 ⇒ muted; any value > 0 unmutes. */
        case 'SET_VOLUME': {
            const volume = clampVolume(action.volume)
            const next: PlaybackState = { ...state, volume, isMuted: volume === 0 }
            return {
                state: next,
                effects: [{ type: 'SET_ENGINE_VOLUME', volume: effectiveVolume(next) }],
            }
        }

        case 'TOGGLE_MUTE': {
            const next: PlaybackState = { ...state, isMuted: !state.isMuted }
            return {
                state: next,
                effects: [{ type: 'SET_ENGINE_VOLUME', volume: effectiveVolume(next) }],
            }
        }

        case 'ADD_TO_QUEUE':
            return {
                state: { ...state, queue: [...state.queue, action.track] },
                effects: [],
            }

        case 'CLEAR_QUEUE':
            return { state: { ...state, queue: [] }, effects: [] }

        case 'SET_QUEUE':
            return { state: { ...state, queue: [...action.tracks] }, effects: [] }

        case 'TOGGLE_SHUFFLE':
            return { state: { ...state, shuffle: !state.shuffle }, effects: [] }

        case 'TOGGLE_REPEAT':
            return { state: { ...state, repeat: !state.repeat }, effects: [] }

        /** §6.1 step 7. Queue and history are left alone, per the spec wording. */
        case 'STOP':
            return {
                state: {
                    ...state,
                    currentTrack: null,
                    currentTime: 0,
                    isPlaying: false,
                    buffering: false,
                },
                effects: [
                    { type: 'STOP_TIME_SYNC' },
                    { type: 'END_SESSION' },
                    { type: 'DESTROY_AUDIO' },
                ],
            }

        default: {
            const exhaustive: never = action
            throw new Error(
                `Unhandled playback action: ${JSON.stringify(exhaustive)}`,
            )
        }
    }
}