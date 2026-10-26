// src/features/catalog/screens/AlbumsScreen.tsx
import { useMemo } from 'react'
import { FlatList } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Card, Screen, Skeleton, StateView, spacing } from '../../../shared/ui'
import { useCatalog } from '../hooks/useCatalog'

export function AlbumsScreen() {
  const navigation = useNavigation()
  const catalog = useCatalog()
  const albums = useMemo(() => catalog.data?.albums ?? [], [catalog.data])

  if (catalog.isLoading) {
    return (
      <Screen>
        <FlatList
          data={Array.from({ length: 6 })}
          keyExtractor={(_, i) => String(i)}
          numColumns={2}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
          columnWrapperStyle={{ gap: spacing.md }}
          renderItem={() => <Skeleton width={160} height={160} />}
        />
      </Screen>
    )
  }
  if (catalog.error) {
    return (
      <Screen>
        <StateView icon="alert-circle-outline" title="Couldn’t load albums" actionLabel="Retry" onAction={() => catalog.refetch()} />
      </Screen>
    )
  }

  return (
    <Screen>
      <FlatList
        data={albums}
        keyExtractor={(a) => a.id}
        numColumns={2}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl }}
        columnWrapperStyle={{ gap: spacing.md }}
        renderItem={({ item }) => (
          <Card
            source={item.cover}
            title={item.title}
            subtitle={item.artist.name}
            width={160}
            onPress={() =>
              navigation.navigate('Browse', {
                screen: 'AlbumDetail',
                params: { albumId: item.id },
              })
            }
          />
        )}
        ListEmptyComponent={<StateView icon="albums" title="No albums" />}
      />
    </Screen>
  )
}
