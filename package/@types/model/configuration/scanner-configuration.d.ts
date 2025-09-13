import { BaseConfiguration } from "./base-configuration";
export declare class ScannerConfiguration extends BaseConfiguration {
    static DEFAULT_VIDEO_RESOLUTION_4K: {
        width: number;
        height: number;
    };
    static DEFAULT_VIDEO_RESOLUTION_HD: {
        width: number;
        height: number;
    };
    static DEFAULT_ACCEPTED_BRIGHTNESS_SCORE: number;
    static DEFAULT_ACCEPTED_ANGLE_SCORE: number;
    static DEFAULT_ACCEPTED_SIZE_SCORE: number;
    /**
     * ScanbotCameraView video constraints
     */
    videoConstraints?: any;
    mirrored?: boolean;
    preferredCamera?: string;
    spinnerColor?: string;
    backgroundColor?: string;
    constructor(resolution: {
        width: number;
        height: number;
    });
    /** @internal */
    static mapVideoConstraints(json: any, configuration: ScannerConfiguration): void;
    /**
     * Error callback of the SDK.
     */
    onError?: (e: any) => void;
}
