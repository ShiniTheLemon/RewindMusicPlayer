// src/shared/ui/Button.tsx
import { Pressable, Text } from 'react-native'
import { Icon, type IconName } from './Icon'
import { colors, radii, spacing, typography } from './theme'

export interface ButtonProps {
  title: string
  onPress?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  icon?: IconName
  disabled?: boolean
  fullWidth?: boolean
}

export function Button({ title, onPress, variant = 'primary', icon, disabled, fullWidth }: ButtonProps) {
  const bg = variant === 'primary' ? colors.primary : variant === 'secondary' ? colors.textPrimary : 'transparent'
  const fg = variant === 'ghost' ? colors.primary : '#ffffff'
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
        backgroundColor: bg,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radii.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        alignSelf: fullWidth ? 'stretch' : 'flex-start',
      })}
    >
      {icon ? <Icon name={icon} size={18} color={fg} /> : null}
      <Text style={[typography.button, { color: fg }]}>{title}</Text>
    </Pressable>
  )
}
