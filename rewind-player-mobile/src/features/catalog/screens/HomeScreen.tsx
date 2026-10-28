// src/features/catalog/screens/HomeScreen.tsx
import { useMemo } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  selectFeaturedArtists,
  selectNewestTracks,
} from '../../../core/application/catalog'
import { Card, Icon, Screen, Section, Skeleton, StateView, colors, spacing, typography } from '../../../shared/ui'
import { useServices } from '../../../shared/ServicesContext'
import { useCatalog } from '../hooks/useCatalog'
import { usePlaylists } from '../hooks/usePlaylists'
import { usePlayTrack } from '../../playback/usePlayback'
import { PlayableTrackRow } from '../../playback/PlayableTrackRow'

const CHART_SIZE = 10

export function HomeScreen() {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const services = useServices()
  const catalog = useCatalog()
  const playlists = usePlaylists()
  const { playAll } = usePlayTrack()

  const chartTracks = useMemo(
    () => (catalog.data ? selectNewestTracks(catalog.data.tracks, CHART_SIZE) : []),
    [catalog.data],
  )
  const featured = useMemo(
    () => (catalog.data ? selectFeaturedArtists(catalog.data.artists, 6) : []),
    [catalog.data],
  )

  const openPlaylist = (playlistId: string) =>
    navigation.navigate('Library', { screen: 'PlaylistDetail', params: { playlistId } })

  if (catalog.isLoading) return <HomeSkeleton topInset={insets.top} />
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

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.sm,
          paddingBottom: spacing.xl,
        }}
      >
        {/* Header: app title + settings */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.md,
            marginBottom: spacing.md,
          }}
        >
          <Text style={[typography.h1, { fontWeight: '800' as const }]}>Rewind</Text>
          <Icon name="settings-outline" size={24} color={colors.textSecondary} />
        </View>

        <Section title="Suggested for you">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.md }}
          >
            {(playlists.data ?? []).map((playlist) => (
              <Card
                key={playlist.id}
                source={services.normalizeOpts.staticCover}
                title={playlist.name}
                subtitle={`${playlist.track_count} ${playlist.track_count === 1 ? 'track' : 'tracks'}`}
                onPress={() => openPlaylist(playlist.id)}
              />
            ))}
          </ScrollView>
        </Section>

        <Section
          title="Top charts"
          action={{ label: 'Play all', onPress: () => playAll(chartTracks) }}
        >
          {chartTracks.map((track, index) => (
            <PlayableTrackRow key={track.id} track={track} rank={index + 1} />
          ))}
        </Section>

        <Section title="Featured artists">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.md }}
          >
            {featured.map((artist) => (
              <Card
                key={artist.id}
                source={artist.avatar}
                title={artist.name}
                circular
                onPress={() =>
                  navigation.navigate('ArtistDetail', { artistId: artist.id })
                }
              />
            ))}
          </ScrollView>
        </Section>
      </ScrollView>
    </Screen>
  )
}

function HomeSkeleton({ topInset }: { topInset: number }) {
  return (
    <Screen>
      <View style={{ paddingTop: topInset + spacing.sm, paddingHorizontal: spacing.md, gap: spacing.md }}>
        <Skeleton width={160} height={28} />
        <Skeleton width="100%" height={140} />
        <Skeleton width="100%" height={220} />
      </View>
    </Screen>
  )
}
