// src/features/auth/useAuth.ts
import { useAuthStore } from './authStore'

export function useAuth() {
  const status = useAuthStore((s) => s.status)
  const user = useAuthStore((s) => s.user)
  const authError = useAuthStore((s) => s.authError)
  const startBootstrap = useAuthStore((s) => s.startBootstrap)
  const signIn = useAuthStore((s) => s.signIn)
  const signOut = useAuthStore((s) => s.signOut)
  return { status, user, authError, startBootstrap, signIn, signOut }
}
