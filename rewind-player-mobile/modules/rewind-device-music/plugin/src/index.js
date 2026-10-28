const { withAndroidManifest, withInfoPlist } = require('expo/config-plugins')

const READ_MEDIA_AUDIO = 'android.permission.READ_MEDIA_AUDIO'
const READ_EXTERNAL_STORAGE = 'android.permission.READ_EXTERNAL_STORAGE'

/**
 * Adds the permissions device-music enumeration needs:
 *  - Android: READ_MEDIA_AUDIO (API 33+) and READ_EXTERNAL_STORAGE (≤ 32)
 *  - iOS: NSAppleMusicUsageDescription
 */
function withDeviceMusicPermissions(config) {
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest
    const permissions = manifest['uses-permission'] ?? []
    const has = (name) =>
      permissions.some((p) => p.$?.['android:name'] === name)

    if (!has(READ_MEDIA_AUDIO)) {
      permissions.push({ $: { 'android:name': READ_MEDIA_AUDIO } })
    }
    if (!has(READ_EXTERNAL_STORAGE)) {
      permissions.push({
        $: { 'android:name': READ_EXTERNAL_STORAGE, 'android:maxSdkVersion': '32' },
      })
    }
    manifest['uses-permission'] = permissions
    return config
  })

  config = withInfoPlist(config, (config) => {
    config.modResults.NSAppleMusicUsageDescription =
      config.modResults.NSAppleMusicUsageDescription ??
      'Rewind Player needs access to your music library to play songs stored on this device.'
    return config
  })

  return config
}

module.exports = withDeviceMusicPermissions
