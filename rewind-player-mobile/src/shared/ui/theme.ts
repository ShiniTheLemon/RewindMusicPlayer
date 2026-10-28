export const colors = {
  primary: '#e53e3e',
  secondary: '#000000',
  textPrimary: '#1f1f1f',
  textSecondary: '#6b6b6b',
  bgLight: '#f8f8f8',
  bgDark: '#121212',
  bgPanel: '#1f1f1f',
  textOnDark: '#f5f5f5',
  textOnDarkSecondary: '#9a9a9a',
  tabInactive: '#8a8a8a',
  border: '#eaeaea',
  surface: '#ffffff',
  skeleton: '#e5e5e5',
} as const

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: colors.textPrimary },
  h2: { fontSize: 22, fontWeight: '700' as const, color: colors.textPrimary },
  h3: { fontSize: 18, fontWeight: '600' as const, color: colors.textPrimary },
  body: { fontSize: 15, color: colors.textPrimary },
  bodySmall: { fontSize: 13, color: colors.textSecondary },
  caption: { fontSize: 12, color: colors.textSecondary },
  button: { fontSize: 15, fontWeight: '600' as const, color: '#ffffff' },
} as const

export const radii = {
    sm: 8,
    md: 12,
    lg: 20,
} as const

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
} as const

export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
    },
} as const
