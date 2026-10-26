// src/shared/ui/Input.tsx
import { TextInput, View, type TextInputProps } from 'react-native'
import { Icon, type IconName } from './Icon'
import { colors, radii, spacing, typography } from './theme'

export interface InputProps extends TextInputProps {
  icon?: IconName
}

export function Input({ icon, style, ...rest }: InputProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.md,
        paddingHorizontal: spacing.md,
        height: 44,
      }}
    >
      {icon ? <Icon name={icon} size={18} color={colors.textSecondary} /> : null}
      <TextInput
        placeholderTextColor={colors.textSecondary}
        style={[{ flex: 1, marginLeft: icon ? spacing.sm : 0, ...typography.body }, style]}
        {...rest}
      />
    </View>
  )
}
