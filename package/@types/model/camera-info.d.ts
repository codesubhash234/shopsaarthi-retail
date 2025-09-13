export type CameraFacingMode = 'front' | 'back' | 'unknown';
export interface CameraInfo {
    deviceId: string;
    label: string;
    facingMode?: CameraFacingMode;
    supportsTorchControl?: boolean;
}
