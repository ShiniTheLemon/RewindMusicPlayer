// src/features/catalog/screens/LibraryScreen.tsx
import { useState, type ReactNode } from 'react'
import { Image } from 'expo-image'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Card, Icon, Input, Screen, Section, Skeleton, colors, radii, spacing, typography } from '../../../shared/ui'
import { useServices } from '../../../shared/ServicesContext'
import { displayName } from '../../../core/application/bootstrap'
import { useAuth } from '../../auth/useAuth'
import { useCatalog } from '../hooks/useCatalog'
import { usePlaylists } from '../hooks/usePlaylists'
import { useStakes } from '../hooks/useStakes'
import { useDeviceTracks } from '../hooks/useDeviceTracks'
import { usePlaybackStore } from '../../playback/playbackStore'
import { PlayableTrackRow } from '../../playback/PlayableTrackRow'

type Segment = 'recent' | 'owned' | 'local' | 'playlists'

const SEGMENTS: { key: Segment; label: string }[] = [
  { key: 'recent', label: 'Recent' },
  { key: 'owned', label: 'Owned' },
  { key: 'local', label: 'Local' },
  { key: 'playlists', label: 'Playlists' },
]

const PAGE_SIZE = 20

/** Reveals items one page at a time — no unbounded scrolling. */
function PagedList<T>({
  items,
  renderItem,
}: {
  items: T[]
  renderItem: (item: T) => ReactNode
}) {
  const [page, setPage] = useState(1)
  const visible = items.slice(0, PAGE_SIZE * page)
  const hasMore = visible.length < items.length
  return (
    <>
      {visible.map(renderItem)}
      {hasMore ? (
        <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.sm }}>
          <Button
            title="Show more"
            variant="ghost"
            onPress={() => setPage((p) => p + 1)}
          />
        </View>
      ) : null}
    </>
  )
}

export function LibraryScreen() {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const services = useServices()
  const { user } = useAuth()
  const catalog = useCatalog()
  const playlists = usePlaylists()
  const stakes = useStakes()
  const device = useDeviceTracks()
  const history = usePlaybackStore((s) => s.history)
  const [segment, setSegment] = useState<Segment>('recent')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const openCreateModal = () => {
    setNewName('')
    setCreateError(null)
    setSelectedIds(new Set())
    setShowCreate(true)
  }

  const toggleTrack = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const submitCreate = async () => {
    const name = newName.trim()
    if (!name || selectedIds.size === 0 || playlists.creating) return
    const tracks = (catalog.data?.tracks ?? []).filter((t) =>
      selectedIds.has(t.id),
    )
    try {
      const result = await playlists.create(name, tracks)
      console.log(
        '[playlists] created',
        result.playlist.id,
        '— failed track ids:',
        result.failedTrackIds,
      )
      setShowCreate(false)
      setNewName('')
      navigation.navigate('PlaylistDetail', { playlistId: result.playlist.id })
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Could not create the playlist')
    }
  }

  const ownedTotal =
    (stakes.data?.ownedTracks.length ?? 0) + (stakes.data?.ownedAlbums.length ?? 0)

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingBottom: spacing.xl,
        }}
      >
        {/* Profile header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            paddingHorizontal: spacing.md,
            marginBottom: spacing.lg,
          }}
        >
          <Image
            source={
              services.normalizeOpts.staticAvatar ??
              services.normalizeOpts.staticCover
            }
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.skeleton,
            }}
            contentFit="cover"
          />
          <View style={{ flex: 1 }}>
            <Text style={typography.h2}>{displayName(user)}</Text>
            <Text style={[typography.bodySmall, { marginTop: 2 }]}>
              {playlists.data?.length ?? 0} playlists · {ownedTotal} owned ·{' '}
              {device.granted ? device.tracks.length : 0} local
            </Text>
          </View>
        </View>

        {/* Segmented control */}
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: spacing.md,
            marginBottom: spacing.md,
            gap: spacing.lg,
          }}
        >
          {SEGMENTS.map((s) => {
            const active = segment === s.key
            return (
              <Pressable
                key={s.key}
                onPress={() => setSegment(s.key)}
                style={{
                  paddingBottom: spacing.xs,
                  borderBottomWidth: 2,
                  borderBottomColor: active ? colors.primary : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: active ? '600' : '400',
                    color: active ? colors.primary : colors.textSecondary,
                  }}
                >
                  {s.label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {segment === 'recent' ? (
          <Section title="Recent plays">
            {history.length === 0 ? (
              <Text style={[typography.bodySmall, { paddingHorizontal: spacing.md }]}>
                Nothing played yet
              </Text>
            ) : (
              <PagedList
                items={history}
                renderItem={(t) => <PlayableTrackRow key={t.id} track={t} />}
              />
            )}
          </Section>
        ) : null}

        {segment === 'owned' ? (
          <>
            <Section title="Owned albums">
              {stakes.isLoading ? (
                <View style={{ paddingHorizontal: spacing.md }}>
                  <Skeleton width="100%" height={80} />
                </View>
              ) : stakes.data && stakes.data.ownedAlbums.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.md }}
                >
                  {stakes.data.ownedAlbums.map((a) => (
                    <Card
                      key={a.id}
                      source={a.cover}
                      title={a.title}
                      subtitle={a.artist.name}
                      onPress={() => navigation.navigate('AlbumDetail', { albumId: a.id })}
                    />
                  ))}
                </ScrollView>
              ) : (
                <Text style={[typography.bodySmall, { paddingHorizontal: spacing.md }]}>
                  No owned albums
                </Text>
              )}
            </Section>

            <Section title="Owned tracks">
              {stakes.isLoading ? (
                <View style={{ paddingHorizontal: spacing.md }}>
                  <Skeleton width="100%" height={80} />
                </View>
              ) : stakes.data && stakes.data.ownedTracks.length > 0 ? (
                <PagedList
                  items={stakes.data.ownedTracks}
                  renderItem={(t) => <PlayableTrackRow key={t.id} track={t} />}
                />
              ) : (
                <Text style={[typography.bodySmall, { paddingHorizontal: spacing.md }]}>
                  No owned tracks
                </Text>
              )}
            </Section>

            {stakes.error ? (
              <Text
                style={[
                  typography.caption,
                  { color: colors.textSecondary, paddingHorizontal: spacing.md },
                ]}
              >
                Stakes failed to load — {String(stakes.error)}
              </Text>
            ) : null}
          </>
        ) : null}

        {segment === 'local' ? (
          <Section title="On this device">
            {device.granted ? (
              <>
                {device.tracks.map((t) => (
                  <PlayableTrackRow key={t.id} track={t} hideFavorite />
                ))}
                {device.error ? (
                  <Text style={[typography.bodySmall, { paddingHorizontal: spacing.md }]}>
                    Couldn’t read device music — {device.error}
                  </Text>
                ) : device.tracks.length === 0 && !device.isLoading ? (
                  <Text style={[typography.bodySmall, { paddingHorizontal: spacing.md }]}>
                    No music found on this device
                  </Text>
                ) : null}
                {device.hasMore ? (
                  <View style={{ paddingHorizontal: spacing.md }}>
                    <Button title="Load more" variant="ghost" onPress={device.loadMore} />
                  </View>
                ) : null}
              </>
            ) : (
              <View style={{ paddingHorizontal: spacing.md }}>
                <Button
                  title="Allow access to device music"
                  onPress={device.requestPermission}
                />
              </View>
            )}
          </Section>
        ) : null}

        {segment === 'playlists' ? (
          <Section
            title="Playlists"
            action={{ label: '+ New', onPress: openCreateModal }}
          >
            {playlists.isLoading ? (
              <View style={{ paddingHorizontal: spacing.md, gap: spacing.sm }}>
                <Skeleton width="100%" height={44} />
                <Skeleton width="100%" height={44} />
              </View>
            ) : playlists.data && playlists.data.length > 0 ? (
              <PagedList
                items={playlists.data}
                renderItem={(p) => (
                  <Pressable
                    key={p.id}
                    onPress={() =>
                      navigation.navigate('PlaylistDetail', { playlistId: p.id })
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
                )}
              />
            ) : (
              <Text style={[typography.bodySmall, { paddingHorizontal: spacing.md }]}>
                No playlists yet
              </Text>
            )}
          </Section>
        ) : null}
      </ScrollView>

      <Modal
        visible={showCreate}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreate(false)}
        statusBarTranslucent
      >
        <Pressable
          onPress={() => setShowCreate(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing.lg,
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 380,
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              padding: spacing.lg,
              gap: spacing.md,
            }}
          >
            <Text style={typography.h3}>New playlist</Text>
            <Input
              placeholder="Playlist name"
              value={newName}
              onChangeText={setNewName}
              autoFocus
              returnKeyType="done"
            />
            <Text style={typography.bodySmall}>
              Pick at least one track ({selectedIds.size} selected)
            </Text>
            <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled>
              {catalog.data
                ? catalog.data.tracks.map((t) => {
                    const selected = selectedIds.has(t.id)
                    return (
                      <Pressable
                        key={t.id}
                        onPress={() => toggleTrack(t.id)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: spacing.sm,
                          paddingVertical: spacing.xs,
                        }}
                      >
                        <Icon
                          name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                          size={20}
                          color={selected ? colors.primary : colors.textSecondary}
                        />
                        <Text numberOfLines={1} style={[typography.body, { flex: 1 }]}>
                          {t.title}
                        </Text>
                        <Text numberOfLines={1} style={typography.bodySmall}>
                          {t.artist.name}
                        </Text>
                      </Pressable>
                    )
                  })
                : null}
            </ScrollView>
            {createError ? (
              <Text style={[typography.bodySmall, { color: colors.primary }]}>
                {createError}
              </Text>
            ) : null}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                gap: spacing.sm,
              }}
            >
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setShowCreate(false)}
              />
              <Button
                title="Create"
                disabled={newName.trim() === '' || selectedIds.size === 0 || playlists.creating}
                onPress={() => void submitCreate()}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  )
}
