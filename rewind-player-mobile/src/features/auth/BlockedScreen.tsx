// src/features/auth/BlockedScreen.tsx
import { useQueryClient } from '@tanstack/react-query'
import { displayName } from '../../core/application/bootstrap'
import { Screen, StateView } from '../../shared/ui'
import { useAuth } from './useAuth'

/**
 * §5.4 blocked state: the Keycloak user exists but has no player-DB row
 * and provisioning did not succeed. The rest of the app does not mount.
 */
export function BlockedScreen() {
  const { user, signOut } = useAuth()
  const qc = useQueryClient()

  const handleSignOut = () => {
    qc.clear()
    void signOut()
  }

  return (
    <Screen>
      <StateView
        icon="alert-circle-outline"
        title="Account unavailable"
        description={`${displayName(user)} isn’t provisioned yet. Sign out and try again in a moment — it usually takes a few seconds after a marketplace purchase.`}
        actionLabel="Sign out"
        onAction={handleSignOut}
      />
    </Screen>
  )
}
