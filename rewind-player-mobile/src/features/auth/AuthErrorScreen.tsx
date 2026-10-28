// src/features/auth/AuthErrorScreen.tsx
import { Screen, StateView } from '../../shared/ui'
import { useAuth } from './useAuth'

/** Transient bootstrap failures (network, config) — retryable. */
export function AuthErrorScreen() {
  const { authError, startBootstrap } = useAuth()
  return (
    <Screen>
      <StateView
        icon="cloud-offline-outline"
        title="Couldn’t sign you in"
        description={authError ?? 'Something went wrong.'}
        actionLabel="Retry"
        onAction={() => void startBootstrap()}
      />
    </Screen>
  )
}
