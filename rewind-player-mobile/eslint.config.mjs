// eslint.config.mjs
import { defineConfig } from 'eslint/config'
import expoConfig from 'eslint-config-expo/flat.js'
import boundaries from 'eslint-plugin-boundaries'

export default defineConfig([
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.expo/**',
      'android/**',
      'ios/**',
      'coverage/**',
    ],
  },

  // Expo's recommended rules (includes the TypeScript parser for .ts/.tsx).
  expoConfig,

  // Architecture boundary enforcement — one-way dependency rule (§8 of the spec).
  {
    files: ['src/**/*.{ts,tsx}', '__tests__/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'core', pattern: 'src/core/**' },
        { type: 'adapters', pattern: 'src/adapters/**' },
        { type: 'features', pattern: 'src/features/**' },
        { type: 'shared', pattern: 'src/shared/**' },
        { type: 'app', pattern: 'src/app/**' },
        { type: 'tests', pattern: '__tests__/**' },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            {
              from: { element: { type: 'core' } },
              allow: { to: { element: { type: 'core' } } },
            },
            {
              from: { element: { type: 'adapters' } },
              allow: {
                to: { element: { type: ['core', 'adapters'] } },
              },
            },
            {
              from: { element: { type: 'features' } },
              allow: {
                to: { element: { type: ['core', 'shared', 'features'] } },
              },
            },
            {
              from: { element: { type: 'shared' } },
              allow: { to: { element: { type: ['core', 'shared'] } } },
            },
            {
              from: { element: { type: 'app' } },
              allow: {
                to: {
                  element: {
                    type: ['core', 'adapters', 'features', 'shared', 'app'],
                  },
                },
              },
            },
            {
              from: { element: { type: 'tests' } },
              allow: {
                to: { element: { type: ['core', 'shared', 'adapters', 'tests'] } },
              },
            },
          ],
        },
      ],
    },
  },
]
)