// src/features/catalog/screens/ArtistDetailScreen.tsx
import { useMemo } from 'react'
import { Image } from 'expo-image'
import { FlatList, Text, View } from 'react-native'
import { useRoute, type RouteProp } from '@react-navigation/native'
import type { BrowseStackParamList } from '../../../shared/navigationTypes'
import { Card, Screen, Skeleton, StateView, colors, spacing, typography } from '../../../shared/ui'
import { useCatalog } from '../hooks/useCatalog'
import { PlayableTrackRow } from '../../playback/PlayableTrackRow'

type ArtistDetailRoute = RouteProp<BrowseStackParamList, 'ArtistDetail'>

export function ArtistDetailScreen() {
  const route = useRoute<ArtistDetailRoute>()
  const { artistId } = route.params
  const catalog = useCatalog()

  const artist = useMemo(
    () => catalog.data?.artists.find((a) => a.id === artistId) ?? null,
    [catalog.data, artistId],
  )
  const albums = useMemo(
    () => catalog.data?.albums.filter((a) => a.artist_id === artistId) ?? [],
    [catalog.data, artistId],
  )
  const tracks = useMemo(
    () => catalog.data?.tracks.filter((t) => t.artist_id === artistId) ?? [],
    [catalog.data, artistId],
  )

  if (catalog.isLoading) {
    return (
      <Screen>
        <View style={{ padding: spacing.md, gap: spacing.md }}>
          <Skeleton width={160} height={160} radius={80} />
          <Skeleton width="60%" height={24} />
        </View>
      </Screen>
    )
  }
  if (!artist) {
    return (
      <Screen>
        <StateView icon="person" title="Artist not found" />
      </Screen>
    )
  }

  return (
    <Screen>
      <FlatList
        data={tracks}
        keyExtractor={(t) => t.id}
        ListHeaderComponent={
          <View>
            <View style={{ padding: spacing.md, alignItems: 'center', gap: spacing.sm }}>
              <Image
                source={artist.avatar}
                style={{ width: 160, height: 160, borderRadius: 80, backgroundColor: colors.skeleton }}
                contentFit="cover"
              />
              <Text style={[typography.h2, { textAlign: 'center' }]}>{artist.name}</Text>
              {artist.bio ? <Text style={[typography.bodySmall, { textAlign: 'center' }]}>{artist.bio}</Text> : null}
            </View>

            {albums.length > 0 ? (
              <View style={{ marginBottom: spacing.lg }}>
                <Text style={[typography.h3, { paddingHorizontal: spacing.md, marginBottom: spacing.sm }]}>Albums</Text>
                <FlatList
                  data={albums}
                  keyExtractor={(a) => a.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.md }}
                  renderItem={({ item }) => (
                    <Card source={item.cover} title={item.title} subtitle={item.release_date ?? undefined} />
                  )}
                />
              </View>
            ) : null}

            <Text style={[typography.h3, { paddingHorizontal: spacing.md, marginBottom: spacing.sm }]}>Tracks</Text>
          </View>
        }
        renderItem={({ item }) => <PlayableTrackRow track={item} />}
        ListEmptyComponent={<Text style={[typography.bodySmall, { padding: spacing.md }]}>No tracks yet.</Text>}
      />
    </Screen>
  )
}
