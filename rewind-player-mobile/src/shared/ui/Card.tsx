// src/shared/ui/Card.tsx
import { Image } from 'expo-image'
import { Pressable, Text, type StyleProp, type ViewStyle } from 'react-native'
import { colors, radii, spacing, typography } from './theme'

export interface CardProps {
  /** Either a URL string or a bundled asset id (`require(...)`). */
  source: string | number
  title: string
  subtitle?: string
  onPress?: () => void
  width?: number
  circular?: boolean
  style?: StyleProp<ViewStyle>
}

export function Card({ source, title, subtitle, onPress, width = 140, circular = false, style }: CardProps) {
  const dimension = width
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        { width, opacity: pressed && onPress ? 0.7 : 1 },
        style,
      ]}
    >
      <Image
        source={source}
        style={{
          width: dimension,
          height: dimension,
          borderRadius: circular ? dimension / 2 : radii.md,
          backgroundColor: colors.skeleton,
        }}
        contentFit="cover"
        transition={150}
      />
      <Text numberOfLines={1} style={[typography.body, { marginTop: spacing.sm }]}>
        {title}
      </Text>
      {subtitle ? (
        <Text numberOfLines={1} style={typography.bodySmall}>
          {subtitle}
        </Text>
      ) : null}
    </Pressable>
  )
}
