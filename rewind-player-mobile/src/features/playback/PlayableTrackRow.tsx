// src/features/playback/PlayableTrackRow.tsx
import { TrackRow } from '../catalog/components/TrackRow'
import { usePlayTrack } from './usePlayback'
import type { Track } from '../../core/domain/entities'

export function PlayableTrackRow({ track }: { track: Track }) {
  const { play } = usePlayTrack()
  return <TrackRow track={track} onPress={() => play(track)} />
}
