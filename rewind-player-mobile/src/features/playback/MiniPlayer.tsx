// src/features/playback/MiniPlayer.tsx
import { Image } from 'expo-image'
import { Pressable, Text, View } from 'react-native'
import { Icon, colors, radii, spacing, typography } from '../../shared/ui'
import { usePlaybackStore } from './playbackStore'
import { ProgressBar } from './ProgressBar'

export function MiniPlayer() {
  const track = usePlaybackStore((s) => s.currentTrack)
  const isPlaying = usePlaybackStore((s) => s.isPlaying)
  const currentTime = usePlaybackStore((s) => s.currentTime)
  const togglePlayPause = usePlaybackStore((s) => s.togglePlayPause)
  const next = usePlaybackStore((s) => s.next)
  const expand = usePlaybackStore((s) => s.expandPlayer)

  if (!track) return null

  return (
    <View
      style={{
        backgroundColor: colors.bgPanel,
        borderTopWidth: 1,
        borderTopColor: '#2c2c2c',
      }}
    >
      <Pressable
        onPress={expand}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          gap: spacing.sm,
          opacity: pressed ? 0.9 : 1,
        })}
      >
        <Image
          source={track.cover}
          style={{
            width: 44,
            height: 44,
            borderRadius: radii.sm,
            backgroundColor: colors.skeleton,
          }}
          contentFit="cover"
        />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={[typography.body, { color: colors.textOnDark }]}>
            {track.title}
          </Text>
          <Text numberOfLines={1} style={[typography.bodySmall, { color: colors.textOnDarkSecondary }]}>
            {track.artist.name}
          </Text>
        </View>
        <Pressable
          onPress={togglePlayPause}
          hitSlop={10}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 6 })}
        >
          <Icon
            name={isPlaying ? 'pause' : 'play'}
            size={26}
            color={colors.textOnDark}
          />
        </Pressable>
        <Pressable
          onPress={next}
          hitSlop={10}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 6 })}
        >
          <Icon name="play-skip-forward" size={22} color={colors.textOnDark} />
        </Pressable>
      </Pressable>
      <ProgressBar
        valueMs={currentTime}
        durationMs={track.duration}
        height={2}
        interactive={false}
        trackColor="#3a3a3a"
      />
    </View>
  )
}
