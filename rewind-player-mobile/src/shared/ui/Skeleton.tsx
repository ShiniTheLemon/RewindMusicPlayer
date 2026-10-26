// src/shared/ui/Skeleton.tsx
import { useEffect } from 'react'
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { colors, radii } from './theme'

export interface SkeletonProps {
  width: number | `${number}%`
  height?: number
  radius?: number
}

export function Skeleton({ width, height = 16, radius = radii.sm }: SkeletonProps) {
  const opacity = useSharedValue(0.4)
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.8, { duration: 900 }), -1, true)
  }, [opacity])
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }))
  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: colors.skeleton }, style]}
    />
  )
}
