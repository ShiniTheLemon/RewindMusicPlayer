// src/features/playback/PlayerModal.tsx
import { Modal } from 'react-native'
import { usePlaybackStore } from './playbackStore'
import { PlayerScreen } from './PlayerScreen'

export function PlayerModal() {
  const expanded = usePlaybackStore((s) => s.playerExpanded)
  const hasTrack = usePlaybackStore((s) => s.currentTrack !== null)
  const collapse = usePlaybackStore((s) => s.collapsePlayer)

  return (
    <Modal
      visible={expanded && hasTrack}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={collapse}
      statusBarTranslucent
    >
      <PlayerScreen />
    </Modal>
  )
}
