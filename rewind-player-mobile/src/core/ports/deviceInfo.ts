export interface DeviceCapabilities {
    audio: boolean
    hls: boolean
}

export interface DeviceInfo {
    deviceType: 'mobile' | 'tablet' | 'desktop' | 'tv' | 'speaker'
    capabilities: DeviceCapabilities
}