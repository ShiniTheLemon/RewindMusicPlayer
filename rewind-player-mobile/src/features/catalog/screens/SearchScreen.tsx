// src/features/catalog/screens/SearchScreen.tsx
import { useState } from 'react'
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Card, Input, Screen, Section, Skeleton, StateView, colors, spacing, typography } from '../../../shared/ui'
import { useSearch } from '../hooks/useSearch'
import { PlayableTrackRow } from '../../playback/PlayableTrackRow'

const TRENDING_CHIPS = ['Acoustic', 'Charts', 'Mixes'] as const

export function SearchScreen() {
  const [query, setQuery] = useState('')
  const search = useSearch(query)
  const navigation = useNavigation()
  const { width } = useWindowDimensions()

  // 2-column grid: three gutters of spacing.md across the screen.
  const cellWidth = (width - spacing.md * 3) / 2

  const showEmptyPrompt = query.trim().length === 0
  const showNoResults =
    !showEmptyPrompt &&
    !search.isLoading &&
    (search.data?.tracks.length ?? 0) === 0 &&
    (search.data?.albums.length ?? 0) === 0 &&
    (search.data?.artists.length ?? 0) === 0

  return (
    <Screen>
      <View style={{ padding: spacing.md, paddingBottom: spacing.sm }}>
        <Input
          icon="search"
          placeholder="Tracks, albums, artists"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm, marginTop: spacing.sm }}
        >
          {TRENDING_CHIPS.map((chip) => {
            const active = query === chip
            return (
              <Pressable
                key={chip}
                onPress={() => setQuery(query === chip ? '' : chip)}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: 6,
                  borderRadius: 16,
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: active ? '#ffffff' : colors.textSecondary,
                  }}
                >
                  {chip}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>
      </View>

      {showEmptyPrompt ? (
        <StateView icon="search" title="Start typing to search" />
      ) : search.isLoading ? (
        <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
          <Skeleton width="100%" height={60} />
          <Skeleton width="100%" height={60} />
          <Skeleton width="100%" height={60} />
        </ScrollView>
      ) : showNoResults ? (
        <StateView icon="search" title="No matches" description={`Nothing matched “${query.trim()}”.`} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
          {search.data!.artists.length > 0 && (
            <Section title="Artists">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.md }}
              >
                {search.data!.artists.map((a) => (
                  <Card
                    key={a.id}
                    source={a.avatar}
                    title={a.name}
                    circular
                    onPress={() =>
                      navigation.navigate('Home', {
                        screen: 'ArtistDetail',
                        params: { artistId: a.id },
                      })
                    }
                  />
                ))}
              </ScrollView>
            </Section>
          )}

          {search.data!.albums.length > 0 && (
            <Section title="Albums">
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  paddingHorizontal: spacing.md,
                  gap: spacing.md,
                }}
              >
                {search.data!.albums.map((a) => (
                  <Card
                    key={a.id}
                    source={a.cover}
                    title={a.title}
                    subtitle={a.artist.name}
                    width={cellWidth}
                    onPress={() =>
                      navigation.navigate('Home', {
                        screen: 'AlbumDetail',
                        params: { albumId: a.id },
                      })
                    }
                  />
                ))}
              </View>
            </Section>
          )}

          {search.data!.tracks.length > 0 && (
            <Section title="Tracks">
              {search.data!.tracks.map((t) => (
                <PlayableTrackRow key={t.id} track={t} />
              ))}
            </Section>
          )}

          {search.data!.artists.length === 0 &&
            search.data!.albums.length === 0 &&
            search.data!.tracks.length === 0 && (
              <Text style={[typography.bodySmall, { paddingHorizontal: spacing.md }]}>
                No results
              </Text>
            )}
        </ScrollView>
      )}
    </Screen>
  )
}
