// src/features/auth/SplashScreen.tsx
import { Text, View } from 'react-native'
import { Button, Screen, colors, spacing, typography } from '../../shared/ui'
import { useAuth } from './useAuth'

/** Shown while unauthenticated — the sign-in gate. */
export function SplashScreen() {
  const { signIn } = useAuth()
  return (
    <Screen>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.md,
          padding: spacing.lg,
        }}
      >
        <Text style={[typography.h1, { fontWeight: '800' as const, color: colors.primary }]}>
          Rewind
        </Text>
        <Text style={typography.bodySmall}>
          Sign in with your Rewind account to start listening
        </Text>
        <View style={{ marginTop: spacing.md }}>
          <Button title="Sign in" onPress={() => void signIn()} />
        </View>
      </View>
    </Screen>
  )
}
