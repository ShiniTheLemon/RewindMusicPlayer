// src/features/catalog/screens/SearchScreen.tsx
import { useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { Card, Input, Screen, Section, Skeleton, StateView, spacing, typography } from '../../../shared/ui'
import { useSearch } from '../hooks/useSearch'
import { usePlayTrack } from '../../playback/usePlayback'

export function SearchScreen() {
  const [query, setQuery] = useState('')
  const search = useSearch(query)
  const { play } = usePlayTrack()

  const showEmptyPrompt = query.trim().length === 0
  const showNoResults =
    !showEmptyPrompt && !search.isLoading && (search.data?.tracks.length ?? 0) === 0 &&
    (search.data?.albums.length ?? 0) === 0 && (search.data?.artists.length ?? 0) === 0

  return (
    <Screen>
      <View style={{ padding: spacing.md }}>
        <Input
          icon="search"
          placeholder="Tracks, albums, artists"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
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
        <ScrollView contentContainerStyle={{ paddingVertical: spacing.md, paddingBottom: spacing.xl }}>
          {search.data!.artists.length > 0 && (
            <Section title="Artists">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.md }}>
                {search.data!.artists.map((a) => (
                  <Card key={a.id} source={a.avatar} title={a.name} circular />
                ))}
              </ScrollView>
            </Section>
          )}
          {search.data!.albums.length > 0 && (
            <Section title="Albums">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.md }}>
                {search.data!.albums.map((a) => (
                  <Card key={a.id} source={a.cover} title={a.title} subtitle={a.artist.name} />
                ))}
              </ScrollView>
            </Section>
          )}
          {search.data!.tracks.length > 0 && (
            <Section title="Tracks">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.md }}>
                {search.data!.tracks.map((t) => (
                  <Card
                    key={t.id}
                    source={t.cover}
                    title={t.title}
                    subtitle={t.artist.name}
                    onPress={() => play(t)}
                  />
                ))}
              </ScrollView>
            </Section>
          )}
          {search.data!.artists.length === 0 &&
            search.data!.albums.length === 0 &&
            search.data!.tracks.length === 0 && (
              <Text style={[typography.bodySmall, { paddingHorizontal: spacing.md }]}>No results</Text>
            )}
        </ScrollView>
      )}
    </Screen>
  )
}
