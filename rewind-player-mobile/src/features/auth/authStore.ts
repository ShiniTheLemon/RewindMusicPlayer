// src/features/auth/authStore.ts
import { create } from 'zustand'
import {
  PROVISION_ATTEMPTED_KEY,
  bootstrap,
  type AuthUser,
  type BootstrapDeps,
  type BootstrapStatus,
} from '../../core/application/bootstrap'
import { usePlaybackStore } from '../playback/playbackStore'

export interface AuthState {
  status: BootstrapStatus
  user: AuthUser | null
  authError: string | null
  startBootstrap: () => Promise<void>
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

let deps: BootstrapDeps | null = null

export function installAuthDeps(d: BootstrapDeps): void {
  deps = d
}

function requireDeps(): BootstrapDeps {
  if (!deps) throw new Error('installAuthDeps() was not called before auth')
  return deps
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'authenticating',
  user: null,
  authError: null,

  startBootstrap: async () => {
    set({ status: 'authenticating', authError: null })
    const result = await bootstrap(requireDeps())
    set({
      status: result.status,
      user: result.user,
      authError: result.authError,
    })
  },

  signIn: async () => {
    try {
      await requireDeps().auth.login()
    } catch (err) {
      set({
        status: 'error',
        authError: err instanceof Error ? err.message : 'Sign-in failed',
      })
      return
    }
    await get().startBootstrap()
  },

  signOut: async () => {
    const d = requireDeps()
    // §5.3: logout clears ALL local state — playback, provision flag, tokens.
    usePlaybackStore.getState().stop()
    d.store.remove(PROVISION_ATTEMPTED_KEY)
    try {
      await d.auth.logout()
    } catch {
      // Local state is already cleared; the gate shows the sign-in CTA.
    }
    set({ status: 'authenticating', user: null, authError: null })
  },
}))
