// src/features/catalog/screens/ArtistsScreen.tsx
import { useMemo } from 'react'
import { FlatList } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Card, Screen, Skeleton, StateView, spacing } from '../../../shared/ui'
import { useCatalog } from '../hooks/useCatalog'

export function ArtistsScreen() {
  const navigation = useNavigation()
  const catalog = useCatalog()
  const artists = useMemo(() => catalog.data?.artists ?? [], [catalog.data])

  if (catalog.isLoading) {
    return (
      <Screen>
        <FlatList
          data={Array.from({ length: 6 })}
          keyExtractor={(_, i) => String(i)}
          numColumns={2}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
          columnWrapperStyle={{ gap: spacing.md }}
          renderItem={() => <Skeleton width={140} height={140} radius={70} />}
        />
      </Screen>
    )
  }
  if (catalog.error) {
    return (
      <Screen>
        <StateView icon="alert-circle-outline" title="Couldn’t load artists" actionLabel="Retry" onAction={() => catalog.refetch()} />
      </Screen>
    )
  }

  return (
    <Screen>
      <FlatList
        data={artists}
        keyExtractor={(a) => a.id}
        numColumns={2}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl }}
        columnWrapperStyle={{ gap: spacing.md, justifyContent: 'space-around' }}
        renderItem={({ item }) => (
          <Card
            source={item.avatar}
            title={item.name}
            width={140}
            circular
            onPress={() =>
              navigation.navigate('Browse', {
                screen: 'ArtistDetail',
                params: { artistId: item.id },
              })
            }
          />
        )}
        ListEmptyComponent={<StateView icon="person" title="No artists" />}
      />
    </Screen>
  )
}
