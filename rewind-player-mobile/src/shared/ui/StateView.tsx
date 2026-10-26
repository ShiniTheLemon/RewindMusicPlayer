// src/shared/ui/StateView.tsx
import { Text, View } from 'react-native'
import { Button } from './Button'
import { Icon, type IconName } from './Icon'
import { colors, spacing, typography } from './theme'

export interface StateViewProps {
  icon: IconName
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function StateView({ icon, title, description, actionLabel, onAction }: StateViewProps) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
      <Icon name={icon} size={40} color={colors.textSecondary} />
      <Text style={[typography.h3, { textAlign: 'center' }]}>{title}</Text>
      {description ? (
        <Text style={[typography.bodySmall, { textAlign: 'center' }]}>{description}</Text>
      ) : null}
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} /> : null}
    </View>
  )
}
