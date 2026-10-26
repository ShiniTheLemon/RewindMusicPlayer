// src/features/playback/BufferingOverlay.tsx
import { ActivityIndicator, Modal, Text, View } from 'react-native'
import { usePlaybackStore } from './playbackStore'
import { colors, spacing, typography } from '../../shared/ui'

export function BufferingOverlay() {
  const buffering = usePlaybackStore((s) => s.buffering)
  const hasTrack = usePlaybackStore((s) => s.currentTrack !== null)

  return (
    <Modal
      visible={buffering && hasTrack}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.35)',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.md,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[typography.body, { color: '#ffffff' }]}>Buffering…</Text>
      </View>
    </Modal>
  )
}
