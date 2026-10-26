// src/features/playback/ProgressBar.tsx
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { colors } from '../../shared/ui'

export interface ProgressBarProps {
  valueMs: number
  durationMs: number
  onSeek?: (ms: number) => void
  height?: number
  /** When false, tapping does nothing (mini player uses this before expand). */
  interactive?: boolean
}

export function ProgressBar({
  valueMs,
  durationMs,
  onSeek,
  height = 4,
  interactive = true,
}: ProgressBarProps) {
  const [trackWidth, setTrackWidth] = useState(0)
  const safeMax = durationMs > 0 ? durationMs : 1
  const ratio = Math.max(0, Math.min(1, valueMs / safeMax))

  return (
    <Pressable
      disabled={!interactive || !onSeek}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      onPress={(e) => {
        if (!onSeek || trackWidth <= 0) return
        const x = e.nativeEvent.locationX
        const next = Math.round((x / trackWidth) * safeMax)
        onSeek(next)
      }}
      hitSlop={{ top: 8, bottom: 8 }}
      style={{
        height,
        backgroundColor: '#e0e0e0',
        borderRadius: height / 2,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${ratio * 100}%`,
          height: '100%',
          backgroundColor: colors.primary,
        }}
      />
    </Pressable>
  )
}
