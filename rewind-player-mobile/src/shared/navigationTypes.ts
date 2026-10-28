// src/shared/navigationTypes.ts
import type { NavigatorScreenParams } from '@react-navigation/native'

/** Album/Artist detail routes exist in both the Home and Library stacks. */
export type CatalogDetailScreens = {
  AlbumDetail: { albumId: string }
  ArtistDetail: { artistId: string }
}

export type HomeStackParamList = {
  HomeMain: undefined
} & CatalogDetailScreens

export type LibraryStackParamList = {
  LibraryHome: undefined
  PlaylistDetail: { playlistId: string }
} & CatalogDetailScreens

export type RootTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined
  Search: undefined
  Library: NavigatorScreenParams<LibraryStackParamList> | undefined
}

/** Union of every route — the composite type screens navigate with. */
export type AppNavigationParamList = RootTabParamList &
  HomeStackParamList &
  LibraryStackParamList

// Makes bare `useNavigation()` return typed navigation everywhere.
declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends AppNavigationParamList {}
  }
}
