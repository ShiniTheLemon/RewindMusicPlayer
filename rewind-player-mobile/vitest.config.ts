import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    resolve: {
        alias: {
            '@core': path.resolve(__dirname, 'src/core'),
            '@shared': path.resolve(__dirname, 'src/shared'),
        },
    },
    test: {
        include: ['__tests__/core/**/*.test.ts'],
        environment: 'node',
    },
})