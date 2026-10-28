// src/features/auth/AuthGate.tsx
import { useEffect, type ReactNode } from 'react'
import { useAuth } from './useAuth'
import { SplashScreen } from './SplashScreen'
import { BlockedScreen } from './BlockedScreen'
import { AuthErrorScreen } from './AuthErrorScreen'

/**
 * §5.4: the rest of the app does not mount until bootstrap reaches
 * 'ready'. Blocked and error states render their own screens.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status, startBootstrap } = useAuth()

  useEffect(() => {
    void startBootstrap()
  }, [startBootstrap])

  if (status === 'ready') return <>{children}</>
  if (status === 'blocked') return <BlockedScreen />
  if (status === 'error') return <AuthErrorScreen />
  return <SplashScreen />
}
