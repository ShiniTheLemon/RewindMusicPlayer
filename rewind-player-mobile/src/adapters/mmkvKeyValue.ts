// src/adapters/mmkvKeyValue.ts
import { createMMKV } from 'react-native-mmkv'
import type { KeyValueStore } from '../core/ports/keyValueStore'

/**
 * Synchronous KeyValueStore over MMKV (AsyncStorage can't back the sync
 * port contract). Also stores the auth tokens for the Keycloak adapter.
 */
export function createMmkvKeyValueStore(id = 'rewind'): KeyValueStore {
  const storage = createMMKV({ id })
  return {
    get: (key) => storage.getString(key) ?? null,
    set: (key, value) => storage.set(key, value),
    remove: (key) => {
      storage.remove(key)
    },
  }
}
