// src/adapters/deviceMusic.ts
import { requireOptionalNativeModule } from 'expo-modules-core'
import type {
    DeviceMusicPage,
    DeviceMusicSource,
} from '../core/ports/deviceMusic'

interface NativeDeviceMusic {
    getPermissionsAsync(): boolean
    requestPermissionsAsync(): Promise<boolean>
    listTracks(offset: number, limit: number): Promise<{
        tracks: {
            id: string
            title: string
            artist: string
            album: string
            durationMs: number | null
            uri: string
            artworkUri: string
            drmProtected: boolean
        }[]
        total: number
        hasMore: boolean
    }>
}

function clean(value: string | null | undefined): string | null {
    if (value == null || value.trim() === '') return null
    return value
}

/**
 * Wraps the rewind-device-music native module. Returns an unavailable
 * source when the module isn't in the build (web, Expo Go) so the feature
 * degrades to a hidden section instead of crashing.
 */
export function createDeviceMusicSource(): DeviceMusicSource {
    const native =
        requireOptionalNativeModule<NativeDeviceMusic>('RewindDeviceMusic')

    if (!native) return unavailableSource()

    return {
        getPermission: async () => native.getPermissionsAsync(),
        requestPermission: async () => native.requestPermissionsAsync(),
        listTracks: async (offset, limit): Promise<DeviceMusicPage> => {
            const page = await native.listTracks(offset, limit)
            return {
                tracks: page.tracks.map((t) => ({
                    id: t.id,
                    title: t.title,
                    artist: clean(t.artist),
                    album: clean(t.album),
                    durationMs:
                        t.durationMs == null ? null : Math.round(t.durationMs),
                    uri: clean(t.uri),
                    artworkUri: clean(t.artworkUri),
                    drmProtected: t.drmProtected,
                })),
                total: page.total,
                hasMore: page.hasMore,
            }
        },
    }
}

function unavailableSource(): DeviceMusicSource {
    return {
        getPermission: async () => false,
        requestPermission: async () => false,
        listTracks: async () => ({ tracks: [], total: 0, hasMore: false }),
    }
}
