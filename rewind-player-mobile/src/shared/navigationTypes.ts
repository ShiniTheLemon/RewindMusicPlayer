// src/shared/navigationTypes.ts
import type { NavigatorScreenParams } from '@react-navigation/native'

export type LibraryStackParamList = {
  LibraryHome: undefined
  PlaylistDetail: { playlistId: string }
}

export type BrowseStackParamList = {
  Albums: undefined
  AlbumDetail: { albumId: string }
  Artists: undefined
  ArtistDetail: { artistId: string }
}

export type RootTabParamList = {
  Home: undefined
  Search: undefined
  Library: NavigatorScreenParams<LibraryStackParamList> | undefined
  Browse: NavigatorScreenParams<BrowseStackParamList> | undefined
}

// Makes bare `useNavigation()` return typed navigation everywhere.
declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootTabParamList {}
  }
}
