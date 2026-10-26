module.exports = function (api) {
    api.cache(true)
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            [
                'module-resolver',
                {
                    alias: {
                        '@core': './src/core',
                        '@shared': './src/shared',
                        '@features': './src/features',
                        '@adapters': './src/adapters',
                        '@app': './src/app',
                    },
                },
            ],
            'react-native-reanimated/plugin',
        ],
    }
}