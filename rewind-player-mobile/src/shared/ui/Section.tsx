// src/shared/ui/Section.tsx
import type { ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import { colors, spacing, typography } from './theme'

export interface SectionProps {
  title: string
  action?: { label: string; onPress: () => void }
  children: ReactNode
}

export function Section({ title, action, children }: SectionProps) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          marginBottom: spacing.sm,
        }}
      >
        <Text style={typography.h3}>{title}</Text>
        {action ? (
          <Pressable onPress={action.onPress} hitSlop={8}>
            <Text style={{ color: colors.primary }}>{action.label}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  )
}
