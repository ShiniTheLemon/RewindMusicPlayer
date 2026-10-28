// src/features/playback/PlayableTrackRow.tsx
import { TrackRow } from '../catalog/components/TrackRow'
import { usePlayTrack } from './usePlayback'
import type { Track } from '../../core/domain/entities'

export function PlayableTrackRow({
  track,
  hideFavorite,
  rank,
}: {
  track: Track
  hideFavorite?: boolean
  rank?: number
}) {
  const { play } = usePlayTrack()
  return (
    <TrackRow
      track={track}
      hideFavorite={hideFavorite}
      rank={rank}
      onPress={() => {
        // Null URI ⇒ DRM-protected device file — nothing to play.
        if (track.url) play(track)
      }}
    />
  )
}
