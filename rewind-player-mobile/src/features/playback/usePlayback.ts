// src/features/playback/usePlayback.ts
import { usePlaybackStore } from './playbackStore'
import type { Track } from '../../core/domain/entities'

export function useNowPlaying(): { track: Track | null; isPlaying: boolean } {
  const track = usePlaybackStore((s) => s.currentTrack)
  const isPlaying = usePlaybackStore((s) => s.isPlaying)
  return { track, isPlaying }
}

export function usePlayTrack() {
  const play = usePlaybackStore((s) => s.play)
  const playAll = usePlaybackStore((s) => s.playAll)
  return { play, playAll }
}
