import type { ExpoConfig, ConfigContext } from 'expo/config';

const appConfig: ExpoConfig = {
    name: 'Rewind Music Player', slug: 'rewind-player-mobile', version: '1.0.0', orientation: 'portrait', scheme: 'rewindplayer', userInterfaceStyle: 'automatic',

    ios: { supportsTablet: true, bundleIdentifier: 'com.rewindplayer.app', infoPlist: { UIBackgroundModes: ['audio'], }, },

    android: { package: 'com.rewindplayer.app', adaptiveIcon: { foregroundImage: './assets/icon.png', backgroundColor: '#f8f8f8', }, permissions: ['android.permission.FOREGROUND_SERVICE', 'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',], },

    plugins: ['expo-dev-client', 'expo-font', 'expo-audio', 'expo-asset', ['expo-build-properties', { android: { compileSdkVersion: 37, targetSdkVersion: 36, }, ios: { deploymentTarget: '16.4', }, },],],

    extra: { eas: { "projectId": "373871ef-b4f7-46ec-b947-87ede6228094" }, },
};

export default ({ config }: ConfigContext): ExpoConfig => ({ ...config, ...appConfig, });