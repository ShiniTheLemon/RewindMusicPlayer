// src/core/application/devices.ts
import type { ApiClient } from '../ports/apiClient'
import type { DeviceCapabilities, DeviceInfo } from '../ports/deviceInfo'

/** §3.7 — one row per registered playback device. */
export interface DeviceResponse {
    id: string
    user_id: string
    device_type: string
    capabilities: DeviceCapabilities
    registered_at: string
}

export async function listDevices(api: ApiClient): Promise<DeviceResponse[]> {
    return api.get<DeviceResponse[]>('/devices/')
}

/**
 * §5.4 step 3. The RN client registers `{ device_type: 'mobile',
 * capabilities: { audio: true, hls: false } }` per the spec.
 */
export async function registerDevice(
    api: ApiClient,
    info: DeviceInfo,
): Promise<DeviceResponse> {
    return api.post<DeviceResponse>('/devices/register', {
        device_type: info.deviceType,
        capabilities: info.capabilities,
    })
}
