// src/features/playback/PlayerScreen.tsx
import { useEffect } from 'react'
import { Image } from 'expo-image'
import { Pressable, Text, View } from 'react-native'
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { formatTime } from '../../core/domain/formatTime'
import { Icon, colors, spacing, typography } from '../../shared/ui'
import { usePlaybackStore } from './playbackStore'
import { ProgressBar } from './ProgressBar'
import { useFavorites } from '../catalog/hooks/useFavorites'

const DISK_SIZE = 280
const DISK_RING = 24
const ART_SIZE = DISK_SIZE - DISK_RING * 2
/** 20 seconds per revolution. */
const ROTATION_MS = 20_000

export function PlayerScreen() {
  const insets = useSafeAreaInsets()
  const track = usePlaybackStore((s) => s.currentTrack)
  const isPlaying = usePlaybackStore((s) => s.isPlaying)
  const currentTime = usePlaybackStore((s) => s.currentTime)
  const shuffle = usePlaybackStore((s) => s.shuffle)
  const repeat = usePlaybackStore((s) => s.repeat)
  const volume = usePlaybackStore((s) => s.volume)
  const isMuted = usePlaybackStore((s) => s.isMuted)
  const togglePlayPause = usePlaybackStore((s) => s.togglePlayPause)
  const next = usePlaybackStore((s) => s.next)
  const previous = usePlaybackStore((s) => s.previous)
  const seek = usePlaybackStore((s) => s.seek)
  const toggleShuffle = usePlaybackStore((s) => s.toggleShuffle)
  const toggleRepeat = usePlaybackStore((s) => s.toggleRepeat)
  const toggleMute = usePlaybackStore((s) => s.toggleMute)
  const setVolume = usePlaybackStore((s) => s.setVolume)
  const collapse = usePlaybackStore((s) => s.collapsePlayer)
  const favorites = useFavorites()

  const rotation = useSharedValue(0)

  useEffect(() => {
    if (!isPlaying) {
      cancelAnimation(rotation)
      return
    }
    const from = rotation.value
    rotation.value = withRepeat(
      withTiming(from + 360, { duration: ROTATION_MS, easing: Easing.linear }),
      -1,
      false,
    )
    return () => cancelAnimation(rotation)
  }, [isPlaying, rotation])

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }))

  if (!track) return null

  const isFavorite = favorites.isFavorite(track.id)

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bgLight,
        paddingTop: insets.top + spacing.sm,
        paddingBottom: insets.bottom + spacing.md,
        paddingHorizontal: spacing.lg,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.lg,
        }}
      >
        <Pressable onPress={collapse} hitSlop={12} style={{ padding: 4 }}>
          <Icon name="chevron-down" size={28} color={colors.textPrimary} />
        </Pressable>
        <Text style={typography.caption}>NOW PLAYING</Text>
        <Pressable
          onPress={() => favorites.toggle(track.id, track)}
          hitSlop={12}
          style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.6 : 1 })}
        >
          <Icon
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={26}
            color={isFavorite ? colors.primary : colors.textPrimary}
          />
        </Pressable>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[{ width: DISK_SIZE, height: DISK_SIZE }, spinStyle]}>
          <View
            style={{
              width: DISK_SIZE,
              height: DISK_SIZE,
              borderRadius: DISK_SIZE / 2,
              backgroundColor: '#111',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image
              source={track.cover}
              style={{
                width: ART_SIZE,
                height: ART_SIZE,
                borderRadius: ART_SIZE / 2,
                backgroundColor: colors.skeleton,
              }}
              contentFit="cover"
            />
          </View>
          <View
            style={{
              position: 'absolute',
              top: DISK_SIZE / 2 - 8,
              left: DISK_SIZE / 2 - 8,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: colors.primary,
              borderWidth: 3,
              borderColor: '#111',
            }}
          />
        </Animated.View>
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <Text numberOfLines={1} style={[typography.h2, { textAlign: 'center' }]}>
          {track.title}
        </Text>
        <Text
          numberOfLines={1}
          style={[typography.bodySmall, { textAlign: 'center', marginTop: spacing.xs }]}
        >
          {track.artist.name}
          {track.album ? ` — ${track.album.title}` : ''}
        </Text>
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <ProgressBar
          valueMs={currentTime}
          durationMs={track.duration}
          onSeek={seek}
          height={6}
        />
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: spacing.xs,
          }}
        >
          <Text style={typography.caption}>{formatTime(currentTime)}</Text>
          <Text style={typography.caption}>{formatTime(track.duration)}</Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: spacing.md,
        }}
      >
        <Pressable onPress={toggleShuffle} hitSlop={10} style={{ padding: 6 }}>
          <Icon
            name="shuffle"
            size={22}
            color={shuffle ? colors.primary : colors.textSecondary}
          />
        </Pressable>
        <Pressable onPress={previous} hitSlop={10} style={{ padding: 6 }}>
          <Icon name="play-skip-back" size={30} color={colors.textPrimary} />
        </Pressable>
        <Pressable
          onPress={togglePlayPause}
          style={({ pressed }) => ({
            width: 68,
            height: 68,
            borderRadius: 34,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Icon
            name={isPlaying ? 'pause' : 'play'}
            size={34}
            color="#ffffff"
          />
        </Pressable>
        <Pressable onPress={next} hitSlop={10} style={{ padding: 6 }}>
          <Icon name="play-skip-forward" size={30} color={colors.textPrimary} />
        </Pressable>
        <Pressable onPress={toggleRepeat} hitSlop={10} style={{ padding: 6 }}>
          <Icon
            name="repeat"
            size={22}
            color={repeat ? colors.primary : colors.textSecondary}
          />
        </Pressable>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginTop: spacing.md,
        }}
      >
        <Pressable onPress={toggleMute} hitSlop={10} style={{ padding: 4 }}>
          <Icon
            name={isMuted || volume === 0 ? 'volume-mute' : 'volume-high'}
            size={20}
            color={colors.textSecondary}
          />
        </Pressable>
        <View style={{ flex: 1 }}>
          <ProgressBar
            valueMs={isMuted ? 0 : volume}
            durationMs={100}
            onSeek={(ms) => setVolume(ms)}
            height={4}
          />
        </View>
      </View>
    </View>
  )
}
