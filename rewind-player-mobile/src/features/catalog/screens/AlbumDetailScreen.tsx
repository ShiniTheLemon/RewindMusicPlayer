// src/features/catalog/screens/AlbumDetailScreen.tsx
import { useMemo } from 'react'
import { Image } from 'expo-image'
import { FlatList, Pressable, Text, View } from 'react-native'
import { useRoute, type RouteProp } from '@react-navigation/native'
import type { BrowseStackParamList } from '../../../shared/navigationTypes'
import { Icon, Screen, Skeleton, StateView, colors, radii, spacing, typography } from '../../../shared/ui'
import { useCatalog } from '../hooks/useCatalog'
import { PlayableTrackRow } from '../../playback/PlayableTrackRow'
import { usePlayTrack } from '../../playback/usePlayback'

type AlbumDetailRoute = RouteProp<BrowseStackParamList, 'AlbumDetail'>

export function AlbumDetailScreen() {
  const route = useRoute<AlbumDetailRoute>()
  const { albumId } = route.params
  const catalog = useCatalog()
  const { playAll } = usePlayTrack()

  const album = useMemo(
    () => catalog.data?.albums.find((a) => a.id === albumId) ?? null,
    [catalog.data, albumId],
  )
  const tracks = useMemo(
    () => catalog.data?.tracks.filter((t) => t.album_id === albumId) ?? [],
    [catalog.data, albumId],
  )

  if (catalog.isLoading) {
    return (
      <Screen>
        <View style={{ padding: spacing.md, gap: spacing.md }}>
          <Skeleton width={200} height={200} />
          <Skeleton width="80%" height={24} />
          <Skeleton width="50%" height={16} />
        </View>
      </Screen>
    )
  }
  if (!album) {
    return (
      <Screen>
        <StateView icon="albums" title="Album not found" />
      </Screen>
    )
  }

  return (
    <Screen>
      <FlatList
        data={tracks}
        keyExtractor={(t) => t.id}
        ListHeaderComponent={
          <View style={{ padding: spacing.md, alignItems: 'center', gap: spacing.sm }}>
            <Image
              source={album.cover}
              style={{ width: 200, height: 200, borderRadius: radii.lg, backgroundColor: colors.skeleton }}
              contentFit="cover"
            />
            <Text style={[typography.h2, { textAlign: 'center' }]}>{album.title}</Text>
            <Text style={typography.bodySmall}>{album.artist.name}</Text>
            {album.release_date ? (
              <Text style={typography.caption}>{album.release_date}</Text>
            ) : null}
            <Pressable
              onPress={() => playAll(tracks)}
              disabled={tracks.length === 0}
              style={({ pressed }) => ({
                marginTop: spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                backgroundColor: colors.primary,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
                borderRadius: 20,
                opacity: tracks.length === 0 ? 0.5 : pressed ? 0.85 : 1,
              })}
            >
              <Icon name="play" size={18} color="#ffffff" />
              <Text style={typography.button}>Play album</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => <PlayableTrackRow track={item} />}
        ListEmptyComponent={<Text style={[typography.bodySmall, { padding: spacing.md }]}>No tracks in this album.</Text>}
      />
    </Screen>
  )
}
