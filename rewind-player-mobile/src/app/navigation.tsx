// src/app/navigation.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { NavigationContainer } from '@react-navigation/native'
import type { HomeStackParamList, LibraryStackParamList, RootTabParamList } from '../shared/navigationTypes'
import { colors } from '../shared/ui'
import { MiniPlayer } from '../features/playback/MiniPlayer'
import { CustomTabBar } from './CustomTabBar'
import { HomeScreen } from '../features/catalog/screens/HomeScreen'
import { SearchScreen } from '../features/catalog/screens/SearchScreen'
import { LibraryScreen } from '../features/catalog/screens/LibraryScreen'
import { PlaylistDetailScreen } from '../features/catalog/screens/PlaylistDetailScreen'
import { AlbumDetailScreen } from '../features/catalog/screens/AlbumDetailScreen'
import { ArtistDetailScreen } from '../features/catalog/screens/ArtistDetailScreen'

const Tab = createBottomTabNavigator<RootTabParamList>()
const HomeStack = createNativeStackNavigator<HomeStackParamList>()
const LibraryStack = createNativeStackNavigator<LibraryStackParamList>()

const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.bgLight },
  headerTintColor: colors.textPrimary,
  headerTitleStyle: { fontWeight: '600' as const },
  contentStyle: { backgroundColor: colors.bgLight },
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={stackScreenOptions}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="AlbumDetail" component={AlbumDetailScreen} options={{ title: 'Album' }} />
      <HomeStack.Screen name="ArtistDetail" component={ArtistDetailScreen} options={{ title: 'Artist' }} />
    </HomeStack.Navigator>
  )
}

function LibraryStackNavigator() {
  return (
    <LibraryStack.Navigator screenOptions={stackScreenOptions}>
      <LibraryStack.Screen name="LibraryHome" component={LibraryScreen} options={{ headerShown: false }} />
      <LibraryStack.Screen
        name="PlaylistDetail"
        component={PlaylistDetailScreen}
        options={{ title: 'Playlist', headerBackTitle: 'Library' }}
      />
      <LibraryStack.Screen name="AlbumDetail" component={AlbumDetailScreen} options={{ title: 'Album' }} />
      <LibraryStack.Screen name="ArtistDetail" component={ArtistDetailScreen} options={{ title: 'Artist' }} />
    </LibraryStack.Navigator>
  )
}

export function Navigation() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: colors.bgLight },
          headerTintColor: colors.textPrimary,
        }}
        tabBar={(props) => (
          <>
            <MiniPlayer />
            <CustomTabBar {...props} />
          </>
        )}
      >
        <Tab.Screen name="Home" component={HomeStackNavigator} />
        <Tab.Screen
          name="Search"
          component={SearchScreen}
          options={{ headerShown: true, title: 'Search' }}
        />
        <Tab.Screen name="Library" component={LibraryStackNavigator} />
      </Tab.Navigator>
    </NavigationContainer>
  )
}
