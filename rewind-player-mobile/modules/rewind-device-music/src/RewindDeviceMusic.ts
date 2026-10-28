import { NativeModule, requireNativeModule } from 'expo'

/** One audio file from the device's local music library. */
export interface RewindDeviceMusicFile {
  id: string
  title: string
  artist: string | null
  album: string | null
  durationMs: number | null
  /** Playable URI — content:// on Android, ipod-library:// on iOS. Empty/null ⇒ DRM-protected. */
  uri: string | null
  artworkUri: string | null
  drmProtected: boolean
}

export interface RewindDeviceMusicPage {
  tracks: RewindDeviceMusicFile[]
  total: number
  hasMore: boolean
}

declare class RewindDeviceMusic extends NativeModule<{}> {
  getPermissionsAsync(): boolean
  requestPermissionsAsync(): Promise<boolean>
  listTracks(offset: number, limit: number): Promise<RewindDeviceMusicPage>
}

export default requireNativeModule<RewindDeviceMusic>('RewindDeviceMusic')
