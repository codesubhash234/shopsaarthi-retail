import { ScannerConfiguration } from "./scanner-configuration";
export declare class TextConfiguration {
    constructor(hint?: HintTextConfiguration);
    hint?: HintTextConfiguration;
}
export interface HintTextConfiguration {
    OK?: string;
    OK_SmallSize?: string;
    OK_BadAngles?: string;
    OK_BadAspectRatio?: string;
    OK_OffCenter?: string;
    Error_NothingDetected?: string;
    Error_Brightness?: string;
    Error_Noise?: string;
}
export declare class StyleConfiguration {
    constructor();
    outline?: OutlineStyleConfiguration;
    captureButton?: CaptureButtonStyleConfiguration;
}
export declare class OutlineStyleConfiguration {
    constructor();
    polygon?: OutlinePolygonStyleConfiguration;
    path?: CaptureAnimationStyleConfiguration;
    label?: OutlineLabelStyleConfiguration;
}
export declare class OutlinePolygonStyleConfiguration {
    strokeCapturing?: string;
    strokeSearching?: string;
    fillCapturing?: string;
    fillSearching?: string;
    strokeWidth?: any;
}
export declare class CaptureAnimationStyleConfiguration {
    stroke?: string;
    strokeWidth?: number;
}
export declare class OutlineLabelStyleConfiguration {
    position?: any;
    top?: any;
    left?: any;
    transform?: any;
    textAlign?: any;
    backgroundColor?: any;
    color?: any;
    borderRadius?: any;
    padding?: any;
    fontFamily?: any;
    fontSize?: any;
}
export declare class CaptureButtonStyleConfiguration {
    color?: string;
}
export declare class DocumentScannerConfiguration extends ScannerConfiguration {
    constructor();
    /**
     *  An average brightness is computed as follows: It is the average
     *  of the Value channel in the HSV color space of:
     *    - the whole image, if no document was detected
     *    - the document crop, if a document was detected
     *  It ranges from 0 to 255.
     *  If this computed value is below the acceptanceBrightnessThreshold, the document is accepted.
     */
    acceptedBrightnessThreshold?: number;
    /**
     * The minimum score in percent (0 - 100) of the perspective
     * distortion to accept a detected document. Default is 75.0.
     */
    acceptedAngleScore?: number;
    /**
     * The minimum document width or height in percent (0-100)
     * of the screen size to accept a detected document. Default is 80.0.
     */
    acceptedSizeScore?: number;
    /**
     * If auto-capture is enabled and when a document is detected, it will be automatically
     * captured when conditions are good and the auto-snapping time-out elapses.
     */
    autoCaptureEnabled?: boolean;
    /**
     * Controls the auto-capture speed. Sensitivity must be within the 0..1 range.
     * A value of 1.0 triggers automatic capturing immediately,
     * a value of 0.0 delays the automatic by 3 seconds. The default value is 0.66 (2 seconds)
     */
    autoCaptureSensitivity?: number;
    /**
     * Delay in milliseconds before the auto-capture is triggered after 'onDocumentDetected' has been called.
     * This delay is used to prevent too many documents being captured in a row.
     * In essence, autoCaptureSensitivity controls the speed of autocapture during the detection phase,
     * while autoCaptureDelay controls the speed of autocapture after the detection phase.
     * Default is 1000ms.
     */
    autoCaptureDelay?: number;
    /**
     * Determines whether to ignore the OK_BUT_BAD_ASPECT_RATIO detection status.
     * By default BadAspectRatio is not ignored.
     */
    ignoreBadAspectRatio?: boolean;
    /**
     * Attempts to take a single exposure using the video capture device,
     * resulting in a high resolution image and potentially greatly improved detection quality.
     * Relies on the experimental ImageCapture API that: https://developer.mozilla.org/en-US/docs/Web/API/ImageCapture.
     * Use with caution. At the time of writing this, reliably only works on Android devices with Google Chrome.
     * If enabled, this only affects extraction after the document outline has been identified.
     * This may also trigger your device's default "snap" animation, making scanbotSDK.utils.flash(); irrelevant
     * Defaults to false.
     */
    useImageCaptureAPI?: boolean;
    text?: TextConfiguration;
    style?: StyleConfiguration;
    /**
     * By default, capture button invokes 'onDocumentDetected' callback, if you want custom behavior,
     * you can optionally override this button
     */
    onCaptureButtonClick?: (e: any) => void;
    /**
     * Document detected callback. Continuous callback,
     * stopped only when detection is stopped or camera widget is disposed.
     * Result contains the following properties:
     * detectionStatus: "OK",
     * success: true,
     * cropped: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
     * original: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
     * polygon: Array(4)}
     */
    onDocumentDetected?: (e: any) => void;
    static fromJson(json: any): DocumentScannerConfiguration;
}
