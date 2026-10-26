// src/features/catalog/screens/PlaylistDetailScreen.tsx
import { FlatList, Text, View } from 'react-native'
import { useRoute, type RouteProp } from '@react-navigation/native'
import type { LibraryStackParamList } from '../../../shared/navigationTypes'
import { Screen, Skeleton, StateView, spacing, typography } from '../../../shared/ui'
import { usePlaylist } from '../hooks/usePlaylist'
import { PlayableTrackRow } from '../../playback/PlayableTrackRow'

type PlaylistDetailRoute = RouteProp<LibraryStackParamList, 'PlaylistDetail'>

export function PlaylistDetailScreen() {
  const route = useRoute<PlaylistDetailRoute>()
  const { playlistId } = route.params
  const playlist = usePlaylist(playlistId)

  if (playlist.isLoading) {
    return (
      <Screen>
        <View style={{ padding: spacing.md, gap: spacing.sm }}>
          <Skeleton width="60%" height={28} />
          <Skeleton width="100%" height={44} />
          <Skeleton width="100%" height={44} />
        </View>
      </Screen>
    )
  }
  if (playlist.error || !playlist.data) {
    return (
      <Screen>
        <StateView
          icon="alert-circle-outline"
          title="Couldn’t load playlist"
          description={playlist.error ? String(playlist.error) : undefined}
          actionLabel="Retry"
          onAction={() => playlist.refetch()}
        />
      </Screen>
    )
  }

  return (
    <Screen>
      <FlatList
        data={playlist.data.tracks}
        keyExtractor={(t) => t.id}
        ListHeaderComponent={
          <View style={{ padding: spacing.md, gap: spacing.xs }}>
            <Text style={typography.h2}>{playlist.data.name}</Text>
            <Text style={typography.bodySmall}>
              {playlist.data.track_count} {playlist.data.track_count === 1 ? 'track' : 'tracks'}
            </Text>
            {/* 1C: read-only. Editing (add/remove/reorder) lands in Phase 5. */}
          </View>
        }
        renderItem={({ item }) => <PlayableTrackRow track={item} />}
        ListEmptyComponent={<Text style={[typography.bodySmall, { padding: spacing.md }]}>This playlist is empty.</Text>}
      />
    </Screen>
  )
}
