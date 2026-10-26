// src/shared/ui/Icon.tsx
import { Ionicons } from '@expo/vector-icons'

export type IconName = keyof typeof Ionicons.glyphMap

export interface IconProps {
  name: IconName
  size?: number
  color?: string
}

export function Icon({ name, size = 20, color }: IconProps) {
  return <Ionicons name={name} size={size} color={color} />
}
