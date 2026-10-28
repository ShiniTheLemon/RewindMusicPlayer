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
        // Only DRM-protected device files are unplayable. Backend tracks
        // always attempt playback — the backend enforces stakes (403 →
        // purchase prompt, §3.8).
        if (track.id.startsWith('local:') && !track.url) return
        play(track)
      }}
    />
  )
}
