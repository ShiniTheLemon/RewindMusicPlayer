// src/adapters/expoAudioEngine.ts
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioPlayerOptions,
  type AudioSource,
} from 'expo-audio'
import type {
  AudioEngine,
  AudioEngineCallbacks,
} from '../core/ports/audioEngine'

/**
 * Real AudioEngine backed by expo-audio (SDK 58).
 *
 * One native player is created lazily and reused for the app's lifetime;
 * `play()` switches sources with `replace()`. The store calls `destroy()`
 * before every LOAD_TRACK, so creating/removing a native player per play
 * would churn expo-audio's native lifecycle — the pattern known to wedge
 * playback (expo#41852). The finished-player path (resume after onEnd) also
 * needs an explicit seekTo(0): ExoPlayer in STATE_ENDED ignores play().
 *
 * RISK (see handoff §13): `AudioSource.headers` is forwarded to the HTTP
 * request, which is what §3.8 legacy tracks need. Verify on device by playing
 * a track whose signed-url resolves to `/playback/stream/{id}` and watching
 * the backend log for an Authorization header.
 */
export function createExpoAudioEngine(): AudioEngine {
  let player: AudioPlayer | null = null
  let callbacks: AudioEngineCallbacks | null = null
  let currentVolume = 80
  let firedOnPlay = false
  let endFired = false
  let audioModeReady: Promise<void> | null = null

  function ensureAudioMode(): Promise<void> {
    if (audioModeReady) return audioModeReady
    audioModeReady = setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch(() => {
      // If mode configuration fails (rare), playback still works but may not
      // be silent-mode / background capable. The store handles engine
      // failures via onError on the first play.
    })
    return audioModeReady
  }

  function buildSource(url: string, headers?: Record<string, string>): AudioSource {
    if (!headers || Object.keys(headers).length === 0) return { uri: url }
    return { uri: url, headers }
  }

  function attachListener(p: AudioPlayer): void {
    // Listener lives for the player's lifetime; it goes inert when
    // destroy() nulls callbacks.
    p.addListener('playbackStatusUpdate', (status) => {
      if (!firedOnPlay && status.isLoaded && status.playing) {
        firedOnPlay = true
        endFired = false // new playback session — clear the previous finish
        callbacks?.onPlay()
      }
      // didJustFinish is sticky on Android (expo#34301) — fire onEnd once
      // per finish.
      if (status.didJustFinish && !endFired) {
        endFired = true
        callbacks?.onEnd()
      }
      if (status.error && callbacks) {
        callbacks.onError(new Error(status.error))
      }
    })
  }

  return {
    play(url, _trackId, cb, headers) {
      void ensureAudioMode()
      callbacks = cb
      firedOnPlay = false
      endFired = false

      const source = buildSource(url, headers)
      try {
        if (!player) {
          const options: AudioPlayerOptions = { keepAudioSessionActive: true }
          player = createAudioPlayer(source, options)
          attachListener(player)
        } else {
          player.replace(source)
        }
        player.volume = currentVolume / 100
        player.play()
      } catch (err) {
        cb.onError(err)
      }
    },

    pause() {
      try { player?.pause() } catch { /* no-op */ }
    },

    resume() {
      if (!player) return
      // A finished player won't restart on play() alone — rewind first
      // (ExoPlayer STATE_ENDED semantics). onPlay re-fires once playing so
      // the store's TRACK_STARTED clears buffering and flips isPlaying
      // (§6.1 step 4); the reducer dedupes history/session via history[0].id.
      if (endFired) {
        player.seekTo(0).catch(() => { /* no-op */ })
      }
      firedOnPlay = false
      try { player.play() } catch { /* swallow; UI stays paused */ }
    },

    seek(ms) {
      if (!player) return
      player.seekTo(ms / 1000)
        .then(() => callbacks?.onSeeked())
        .catch(() => { /* no-op */ })
    },

    getCurrentTimeMs() {
      if (!player) return 0
      const seconds = player.currentTime
      return Number.isFinite(seconds) ? Math.max(0, seconds * 1000) : 0
    },

    setVolume(percent) {
      currentVolume = Math.max(0, Math.min(100, percent))
      if (player) player.volume = currentVolume / 100
    },

    isPlaying() {
      return player?.playing ?? false
    },

    destroy() {
      // Soft teardown: stop the current source but keep the native player
      // alive for reuse. The listener stays attached and goes inert because
      // callbacks are nulled.
      callbacks = null
      firedOnPlay = false
      endFired = false
      try { player?.pause() } catch { /* no-op */ }
    },
  }
}
