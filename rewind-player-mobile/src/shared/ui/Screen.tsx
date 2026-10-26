// src/shared/ui/Screen.tsx
import type { ReactNode } from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'
import { colors } from './theme'

export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  // Native stack/tab headers handle the top inset, tab bar handles the bottom.
  // Screens that need extra bottom padding do it in their ScrollView contentContainerStyle.
  return <View style={[{ flex: 1, backgroundColor: colors.bgLight }, style]}>{children}</View>
}
