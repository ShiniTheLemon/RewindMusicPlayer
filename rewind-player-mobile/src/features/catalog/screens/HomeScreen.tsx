// src/features/catalog/screens/HomeScreen.tsx
import { useMemo } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import {
  selectFeaturedArtists,
  selectNewestAlbums,
  selectNewestTracks,
} from '../../../core/application/catalog'
import { Card, Icon, Screen, Section, Skeleton, StateView, colors, radii, spacing, typography } from '../../../shared/ui'
import { useCatalog } from '../../catalog/hooks/useCatalog'
import { usePlaylists } from '../hooks/usePlaylists'
import { usePlayTrack } from '../../playback/usePlayback'

export function HomeScreen() {
  const navigation = useNavigation()
  const catalog = useCatalog()
  const playlists = usePlaylists()
  const { play } = usePlayTrack()

  const featured = useMemo(
    () => (catalog.data ? selectFeaturedArtists(catalog.data.artists, 3) : []),
    [catalog.data],
  )
  const newestTracks = useMemo(
    () => (catalog.data ? selectNewestTracks(catalog.data.tracks, 5) : []),
    [catalog.data],
  )
  const newestAlbums = useMemo(
    () => (catalog.data ? selectNewestAlbums(catalog.data.albums, 4) : []),
    [catalog.data],
  )

  if (catalog.isLoading) return <HomeSkeleton />
  if (catalog.error) {
    return (
      <Screen>
        <StateView
          icon="alert-circle-outline"
          title="Couldn’t load the catalog"
          description={String(catalog.error)}
          actionLabel="Retry"
          onAction={() => catalog.refetch()}
        />
      </Screen>
    )
  }

  const openPlaylist = (playlistId: string) =>
    navigation.navigate('Library', { screen: 'PlaylistDetail', params: { playlistId } })

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingVertical: spacing.md }}>
        <Pressable
          onPress={() => navigation.navigate('Search')}
          style={({ pressed }) => ({
            marginHorizontal: spacing.md,
            marginBottom: spacing.lg,
            padding: spacing.md,
            borderRadius: radii.md,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Icon name="search" size={18} color={colors.textSecondary} />
          <Text style={typography.bodySmall}>Search tracks, albums, artists</Text>
        </Pressable>

        <Section title="Featured artists">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.md }}>
            {featured.map((artist) => (
              <Card
                key={artist.id}
                source={artist.avatar}
                title={artist.name}
                circular
                onPress={() =>
                  navigation.navigate('Browse', {
                    screen: 'ArtistDetail',
                    params: { artistId: artist.id },
                  })
                }
              />
            ))}
          </ScrollView>
        </Section>

        <Section title="New tracks">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.md }}>
            {newestTracks.map((track) => (
              <Card
                key={track.id}
                source={track.cover}
                title={track.title}
                subtitle={track.artist.name}
                onPress={() => play(track)}
              />
            ))}
          </ScrollView>
        </Section>

        <Section title="New albums">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.md }}>
            {newestAlbums.map((album) => (
              <Card
                key={album.id}
                source={album.cover}
                title={album.title}
                subtitle={album.artist.name}
                onPress={() =>
                  navigation.navigate('Browse', {
                    screen: 'AlbumDetail',
                    params: { albumId: album.id },
                  })
                }
              />
            ))}
          </ScrollView>
        </Section>

        <Section
          title="Your playlists"
          action={{ label: 'See all', onPress: () => navigation.navigate('Library') }}
        >
          <View>
            {(playlists.data ?? []).map((playlist) => (
              <Pressable
                key={playlist.id}
                onPress={() => openPlaylist(playlist.id)}
                style={({ pressed }) => ({
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text numberOfLines={1} style={typography.body}>
                  {playlist.name}
                </Text>
                <Text style={typography.bodySmall}>
                  {playlist.track_count} {playlist.track_count === 1 ? 'track' : 'tracks'}
                </Text>
              </Pressable>
            ))}
            {playlists.data && playlists.data.length === 0 ? (
              <Text style={[typography.bodySmall, { paddingHorizontal: spacing.md }]}>No playlists yet</Text>
            ) : null}
          </View>
        </Section>
      </ScrollView>
    </Screen>
  )
}

function HomeSkeleton() {
  return (
    <Screen>
      <View style={{ padding: spacing.md, gap: spacing.md }}>
        <Skeleton width="100%" height={44} />
        <Skeleton width="100%" height={140} />
        <Skeleton width="100%" height={140} />
        <Skeleton width="100%" height={140} />
      </View>
    </Screen>
  )
}
