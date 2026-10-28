// src/features/playback/playbackStore.ts
import { create } from 'zustand'
import {
  INITIAL_PLAYBACK_STATE,
  playbackReducer,
  type PlaybackAction,
  type PlaybackEffect,
  type PlaybackState,
} from '../../core/domain/queue'
import type { Track } from '../../core/domain/entities'
import type { AudioEngine } from '../../core/ports/audioEngine'
import { ApiError } from '../../core/domain/errors'

export interface PlaybackDeps {
  engine: AudioEngine
  /** Resolves a playable URL for a track. 1C returned a stub URL; the real
   *  resolver returns presigned URLs, or the legacy stream path with the
   *  bearer in `headers` (§3.8). */
  resolveUrl: (
    track: Track,
  ) => Promise<{ url: string; headers?: Record<string, string> }>
}

export interface PlaybackStore extends PlaybackState {
  playerExpanded: boolean

  play: (track: Track) => void
  playAll: (tracks: Track[], startIndex?: number) => void
  togglePlayPause: () => void
  pause: () => void
  resume: () => void
  seek: (ms: number) => void
  next: () => void
  previous: () => void
  setVolume: (v: number) => void
  toggleMute: () => void
  toggleShuffle: () => void
  toggleRepeat: () => void
  addToQueue: (track: Track) => void
  clearQueue: () => void
  stop: () => void
  dismissPurchasePrompt: () => void
  expandPlayer: () => void
  collapsePlayer: () => void
}

let deps: PlaybackDeps | null = null
let timeSync: ReturnType<typeof setInterval> | null = null

export function installPlaybackDeps(d: PlaybackDeps): void {
  deps = d
}

function requireDeps(): PlaybackDeps {
  if (!deps) throw new Error('installPlaybackDeps() was not called before playback')
  return deps
}

export const usePlaybackStore = create<PlaybackStore>((set, get) => {
  function pickState(): PlaybackState {
    const s = get()
    return {
      currentTrack: s.currentTrack,
      isPlaying: s.isPlaying,
      currentTime: s.currentTime,
      volume: s.volume,
      isMuted: s.isMuted,
      queue: s.queue,
      history: s.history,
      shuffle: s.shuffle,
      repeat: s.repeat,
      buffering: s.buffering,
      purchasePrompt: s.purchasePrompt,
    }
  }

  function stopTimeSync(): void {
    if (timeSync !== null) {
      clearInterval(timeSync)
      timeSync = null
    }
  }

  function startTimeSync(): void {
    stopTimeSync()
    timeSync = setInterval(() => {
      // Engine-authoritative; not routed through the reducer.
      set({ currentTime: requireDeps().engine.getCurrentTimeMs() })
    }, 500)
  }

  async function handleLoadTrack(track: Track): Promise<void> {
    const { engine, resolveUrl } = requireDeps()
    console.log('[playback] resolving track:', track.id, `"${track.title}"`)
    try {
      const { url, headers } = await resolveUrl(track)
      console.log('[playback] resolved URL:', url.slice(0, 100), headers ? '(with headers)' : '')
      dispatch({ type: 'TRACK_LOADED', track })
      engine.play(url, track.id, {
        onPlay: () => dispatch({ type: 'TRACK_STARTED' }),
        onEnd: () => dispatch({ type: 'TRACK_ENDED' }),
        onError: () => dispatch({ type: 'TRACK_ERROR' }),
        onSeeked: () => dispatch({ type: 'SEEKED' }),
      }, headers)
    } catch (err) {
      console.log(
        '[playback] resolve FAILED for',
        track.id,
        '→',
        err instanceof Error ? `${err.name}: ${err.message}` : String(err),
      )
      if (ApiError.isAccessDenied(err)) {
        console.log('[playback] 403 ⇒ showing purchase prompt')
        dispatch({ type: 'LOAD_DENIED', track })
      } else {
        dispatch({ type: 'TRACK_ERROR' })
      }
    }
  }

  function executeEffect(effect: PlaybackEffect): void {
    const { engine } = requireDeps()
    switch (effect.type) {
      case 'LOAD_TRACK':
        void handleLoadTrack(effect.track)
        return
      case 'DESTROY_AUDIO':
        engine.destroy()
        return
      case 'PAUSE_AUDIO':
        engine.pause()
        return
      case 'RESUME_AUDIO':
        engine.resume()
        return
      case 'SEEK_AUDIO':
        engine.seek(effect.positionMs)
        return
      case 'SET_ENGINE_VOLUME':
        engine.setVolume(effect.volume)
        return
      case 'START_TIME_SYNC':
        startTimeSync()
        return
      case 'STOP_TIME_SYNC':
        stopTimeSync()
        return
      case 'START_SESSION':
      case 'END_SESSION':
        // TODO 1D: POST /playback/start and /playback/{id}/end with device id.
        return
    }
  }

  function dispatch(action: PlaybackAction): void {
    const { state, effects } = playbackReducer(pickState(), action)
    set(state)
    for (const effect of effects) executeEffect(effect)
  }

  return {
    ...INITIAL_PLAYBACK_STATE,
    playerExpanded: false,

    play: (track) => {
      console.log('[playback] play requested:', track.id, `"${track.title}"`)
      dispatch({ type: 'PLAY', track })
    },

    playAll: (tracks, startIndex = 0) => {
      if (tracks.length === 0) return
      const first = tracks[startIndex]
      if (!first) return
      const rest = tracks.slice(startIndex + 1)
      dispatch({ type: 'SET_QUEUE', tracks: rest })
      dispatch({ type: 'PLAY', track: first })
    },

    togglePlayPause: () => {
      const s = get()
      if (!s.currentTrack) return
      if (s.isPlaying) dispatch({ type: 'PAUSE' })
      else dispatch({ type: 'RESUME' })
    },

    pause: () => dispatch({ type: 'PAUSE' }),
    resume: () => dispatch({ type: 'RESUME' }),
    seek: (ms) => dispatch({ type: 'SEEK', positionMs: ms }),
    next: () => dispatch({ type: 'NEXT' }),
    previous: () => dispatch({ type: 'PREVIOUS' }),
    setVolume: (v) => dispatch({ type: 'SET_VOLUME', volume: v }),
    toggleMute: () => dispatch({ type: 'TOGGLE_MUTE' }),
    toggleShuffle: () => dispatch({ type: 'TOGGLE_SHUFFLE' }),
    toggleRepeat: () => dispatch({ type: 'TOGGLE_REPEAT' }),
    addToQueue: (track) => dispatch({ type: 'ADD_TO_QUEUE', track }),
    clearQueue: () => dispatch({ type: 'CLEAR_QUEUE' }),
    stop: () => dispatch({ type: 'STOP' }),
    dismissPurchasePrompt: () => dispatch({ type: 'DISMISS_PURCHASE_PROMPT' }),
    expandPlayer: () => set({ playerExpanded: true }),
    collapsePlayer: () => set({ playerExpanded: false }),
  }
})
