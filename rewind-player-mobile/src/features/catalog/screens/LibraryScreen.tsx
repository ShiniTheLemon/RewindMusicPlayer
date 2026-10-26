// src/features/catalog/screens/LibraryScreen.tsx
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Card, Screen, Section, Skeleton, colors, spacing, typography } from '../../../shared/ui'
import { useFavorites } from '../hooks/useFavorites'
import { usePlaylists } from '../hooks/usePlaylists'
import { useStakes } from '../hooks/useStakes'
import { usePlayTrack } from '../../playback/usePlayback'

export function LibraryScreen() {
  const navigation = useNavigation()
  const playlists = usePlaylists()
  const stakes = useStakes()
  const favorites = useFavorites()
  const { play } = usePlayTrack()

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingVertical: spacing.md, paddingBottom: spacing.xl }}>
        <Section title="Playlists">
          {playlists.isLoading ? (
            <View style={{ paddingHorizontal: spacing.md, gap: spacing.sm }}>
              <Skeleton width="100%" height={44} />
              <Skeleton width="100%" height={44} />
            </View>
          ) : playlists.data && playlists.data.length > 0 ? (
            playlists.data.map((p) => (
              <Pressable
                key={p.id}
                onPress={() =>
                  navigation.navigate('Library', {
                    screen: 'PlaylistDetail',
                    params: { playlistId: p.id },
                  })
                }
                style={({ pressed }) => ({
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text numberOfLines={1} style={typography.body}>{p.name}</Text>
                <Text style={typography.bodySmall}>
                  {p.track_count} {p.track_count === 1 ? 'track' : 'tracks'}
                </Text>
              </Pressable>
            ))
          ) : (
            <Text style={[typography.bodySmall, { paddingHorizontal: spacing.md }]}>No playlists yet</Text>
          )}
        </Section>

        <Section title="Owned albums">
          {stakes.isLoading ? (
            <Skeleton width="100%" height={80} />
          ) : stakes.data && stakes.data.ownedAlbums.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.md }}>
              {stakes.data.ownedAlbums.map((a) => (
                <Card
                  key={a.id}
                  source={a.cover}
                  title={a.title}
                  subtitle={a.artist.name}
                  onPress={() =>
                    navigation.navigate('Browse', {
                      screen: 'AlbumDetail',
                      params: { albumId: a.id },
                    })
                  }
                />
              ))}
            </ScrollView>
          ) : (
            <Text style={[typography.bodySmall, { paddingHorizontal: spacing.md }]}>No owned albums</Text>
          )}
        </Section>

        <Section title="Owned tracks">
          {stakes.isLoading ? (
            <Skeleton width="100%" height={80} />
          ) : stakes.data && stakes.data.ownedTracks.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.md }}>
              {stakes.data.ownedTracks.map((t) => (
                <Card
                  key={t.id}
                  source={t.cover}
                  title={t.title}
                  subtitle={t.artist.name}
                  onPress={() => play(t)}
                />
              ))}
            </ScrollView>
          ) : (
            <Text style={[typography.bodySmall, { paddingHorizontal: spacing.md }]}>No owned tracks</Text>
          )}
        </Section>

        <Section title="Favorites">
          {favorites.query.isLoading ? (
            <Skeleton width="100%" height={80} />
          ) : favorites.query.data && favorites.query.data.tracks.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.md }}>
              {favorites.query.data.tracks.map((t) => (
                <Card
                  key={t.id}
                  source={t.cover}
                  title={t.title}
                  subtitle={t.artist.name}
                  onPress={() => play(t)}
                />
              ))}
            </ScrollView>
          ) : (
            <Text style={[typography.bodySmall, { paddingHorizontal: spacing.md }]}>No favorites yet</Text>
          )}
        </Section>

        {stakes.error ? (
          <Text style={[typography.caption, { color: colors.textSecondary, paddingHorizontal: spacing.md }]}>
            Stakes failed to load — {String(stakes.error)}
          </Text>
        ) : null}
      </ScrollView>
    </Screen>
  )
}
