// src/app/CustomTabBar.tsx
import { Pressable, Text, View } from 'react-native'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Icon, colors, spacing } from '../shared/ui'
import type { IconName } from '../shared/ui'

const TAB_ROUTES = ['Home', 'Search', 'Library'] as const

const TAB_ICONS: Record<(typeof TAB_ROUTES)[number], IconName> = {
  Home: 'home',
  Search: 'search',
  Library: 'library',
}

/**
 * NetEase-style bottom bar: dark surface, red accent on the active tab,
 * icon over a small label. The MiniPlayer is rendered above it by the
 * tabBar render prop in navigation.tsx.
 */
export function CustomTabBar({ state, navigation, insets }: BottomTabBarProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.bgDark,
        borderTopWidth: 1,
        borderTopColor: '#2c2c2c',
        paddingTop: spacing.sm,
        paddingBottom: insets.bottom + spacing.xs,
      }}
    >
      {state.routes
        .filter((route) => (TAB_ROUTES as readonly string[]).includes(route.name))
        .map((route) => {
          const index = state.routes.findIndex((r) => r.key === route.key)
          const isFocused = index === state.index
          const color = isFocused ? colors.primary : colors.tabInactive
          const icon = TAB_ICONS[route.name as keyof typeof TAB_ICONS]

          return (
            <Pressable
              key={route.key}
              onPress={() => navigation.navigate(route.name, route.params)}
              style={{ flex: 1, alignItems: 'center', gap: 2 }}
            >
              <Icon name={icon} size={22} color={color} />
              <Text
                style={{
                  fontSize: 10,
                  color,
                  fontWeight: isFocused ? '600' : '400',
                }}
              >
                {route.name}
              </Text>
            </Pressable>
          )
        })}
    </View>
  )
}
