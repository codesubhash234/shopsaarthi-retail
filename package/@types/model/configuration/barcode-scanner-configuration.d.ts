import { BarcodeResult } from "../barcode/barcode-result";
import { EngineMode } from "../barcode/engine-mode";
import { BarcodeFormat } from "../barcode/barcode-format";
import { SelectionOverlayConfiguration } from "./selection-overlay-configuration";
import { BarcodeCountConfiguration } from "./barcode-count-configuration";
import { GS1Handling } from "../barcode/gs1-handling";
import { ViewFinderScannerConfiguration } from "./view-finder-scanner-configuration";
export declare class BarcodeScannerConfiguration extends ViewFinderScannerConfiguration {
    constructor();
    /**
     * Capture delay in milliseconds after detecting barcodes. Defaults to 1000
     */
    captureDelay?: number;
    overlay?: SelectionOverlayConfiguration;
    engineMode?: EngineMode;
    barcodeFormats?: BarcodeFormat[];
    returnBarcodeImage?: boolean;
    /**
     * Special property to enable barcode count mode.
     * This is a type of a ready-to-use user interface scanning and counting found barcodes.
     * It can be configured via its 'style' (BarcodeCountStyleConfiguration) property.
     * It returns results normally via 'onBarcodesDetected' callback.
     * Please note that results are returned for each consecutive scan, not only after the last scan
     */
    scanAndCount?: BarcodeCountConfiguration;
    /**
     * Digital zoom level of the video stream. Defaults to 1.0.
     * Please note that this is not the same as the optical zoom of the camera.
     */
    zoom?: number;
    /**
     * If set, only barcodes that match this regular expression will be detected.
     */
    barcodesRegexFilter?: RegExp;
    gs1Handling?: GS1Handling;
    /**
     * If set, limit the resolution of the image that is used for barcode recognition.
     * A lower value will result in faster processing times but may reduce recognition quality.
     */
    desiredRecognitionResolution?: number;
    /**
     */
    onBarcodesDetected?: (e: BarcodeResult) => void;
    _onDetectionFailed?: (e: ImageData) => void;
    static fromJson(json: any): BarcodeScannerConfiguration;
}
