// src/app/navigation.tsx
import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { NavigationContainer } from '@react-navigation/native'
import type { BrowseStackParamList, LibraryStackParamList, RootTabParamList } from '../shared/navigationTypes'
import { MiniPlayer } from '../features/playback/MiniPlayer'
import { Icon, colors } from '../shared/ui'
import { AlbumDetailScreen } from '../features/catalog/screens/AlbumDetailScreen'
import { AlbumsScreen } from '../features/catalog/screens/AlbumsScreen'
import { ArtistDetailScreen } from '../features/catalog/screens/ArtistDetailScreen'
import { ArtistsScreen } from '../features/catalog/screens/ArtistsScreen'
import { HomeScreen } from '../features/catalog/screens/HomeScreen'
import { LibraryScreen } from '../features/catalog/screens/LibraryScreen'
import { PlaylistDetailScreen } from '../features/catalog/screens/PlaylistDetailScreen'
import { SearchScreen } from '../features/catalog/screens/SearchScreen'

const Tab = createBottomTabNavigator<RootTabParamList>()
const LibraryStack = createNativeStackNavigator<LibraryStackParamList>()
const BrowseStack = createNativeStackNavigator<BrowseStackParamList>()

const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.bgLight },
  headerTintColor: colors.textPrimary,
  headerTitleStyle: { fontWeight: '600' as const },
  contentStyle: { backgroundColor: colors.bgLight },
}

function LibraryStackNavigator() {
  return (
    <LibraryStack.Navigator screenOptions={stackScreenOptions}>
      <LibraryStack.Screen name="LibraryHome" component={LibraryScreen} options={{ title: 'Library' }} />
      <LibraryStack.Screen
        name="PlaylistDetail"
        component={PlaylistDetailScreen}
        options={({ route }) => ({ title: 'Playlist', headerBackTitle: 'Library' })}
      />
    </LibraryStack.Navigator>
  )
}

function BrowseStackNavigator() {
  return (
    <BrowseStack.Navigator screenOptions={stackScreenOptions}>
      <BrowseStack.Screen name="Albums" component={AlbumsScreen} options={{ title: 'Albums' }} />
      <BrowseStack.Screen name="AlbumDetail" component={AlbumDetailScreen} options={{ title: 'Album' }} />
      <BrowseStack.Screen name="Artists" component={ArtistsScreen} options={{ title: 'Artists' }} />
      <BrowseStack.Screen name="ArtistDetail" component={ArtistDetailScreen} options={{ title: 'Artist' }} />
    </BrowseStack.Navigator>
  )
}

export function Navigation() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.bgLight },
          headerTintColor: colors.textPrimary,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
        }}
        tabBar={(props) => (
          <>
            <MiniPlayer />
            <BottomTabBar {...props} />
          </>
        )}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color} /> }}
        />
        <Tab.Screen
          name="Search"
          component={SearchScreen}
          options={{ title: 'Search', tabBarIcon: ({ color, size }) => <Icon name="search" size={size} color={color} /> }}
        />
        <Tab.Screen
          name="Library"
          component={LibraryStackNavigator}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Icon name="library" size={size} color={color} />,
          }}
        />
        <Tab.Screen
          name="Browse"
          component={BrowseStackNavigator}
          options={{
            headerShown: false,
            title: 'Browse',
            tabBarIcon: ({ color, size }) => <Icon name="disc" size={size} color={color} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  )
}
