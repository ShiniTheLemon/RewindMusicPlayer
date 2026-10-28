// src/features/catalog/components/TrackRow.tsx
import { Image } from 'expo-image'
import { Pressable, Text, View } from 'react-native'
import { formatTime } from '../../../core/domain/formatTime'
import type { Track } from '../../../core/domain/entities'
import { Icon, colors, radii, spacing, typography } from '../../../shared/ui'
import { useFavorites } from '../hooks/useFavorites'

export interface TrackRowProps {
  track: Track
  /** Wired by PlayableTrackRow to the playback store; inert when absent. */
  onPress?: () => void
  /** Hides the favorite heart for tracks that don't exist in the backend (device-local). */
  hideFavorite?: boolean
  /** Chart rank (1-based). Top 3 render in the primary red. */
  rank?: number
}

export function TrackRow({ track, onPress, hideFavorite, rank }: TrackRowProps) {
  const favorites = useFavorites()
  const isFavorite = favorites.isFavorite(track.id)

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        gap: spacing.md,
        opacity: pressed && onPress ? 0.7 : 1,
      })}
    >
      {rank !== undefined ? (
        <Text
          style={{
            width: 28,
            textAlign: 'center',
            fontSize: 17,
            fontWeight: '700',
            fontStyle: 'italic',
            color: rank <= 3 ? colors.primary : colors.textSecondary,
          }}
        >
          {String(rank).padStart(2, '0')}
        </Text>
      ) : null}
      <Image
        source={track.cover}
        style={{ width: 44, height: 44, borderRadius: radii.sm, backgroundColor: colors.skeleton }}
        contentFit="cover"
      />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text numberOfLines={1} style={[typography.body, { flexShrink: 1 }]}>
            {track.title}
          </Text>
          {track.explicit ? (
            <View style={{ borderWidth: 1, borderColor: colors.textSecondary, borderRadius: 2, paddingHorizontal: 4 }}>
              <Text style={typography.caption}>E</Text>
            </View>
          ) : null}
        </View>
        <Text numberOfLines={1} style={typography.bodySmall}>
          {track.artist.name}
        </Text>
      </View>
      <Text style={typography.caption}>{formatTime(track.duration)}</Text>
      {hideFavorite ? null : (
        <Pressable
          onPress={() => favorites.toggle(track.id, track)}
          hitSlop={8}
          style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.6 : 1 })}
        >
          <Icon
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavorite ? colors.primary : colors.textSecondary}
          />
        </Pressable>
      )}
    </Pressable>
  )
}
