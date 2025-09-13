import { TextDetectionCallback } from "./text-data-scanner-configuration";
import { ViewFinderScannerConfiguration } from "./view-finder-scanner-configuration";
export declare class VINScannerConfiguration extends ViewFinderScannerConfiguration {
    constructor();
    ocrResolutionLimit?: number;
    onTextDetected?: TextDetectionCallback;
    static fromJson(json: any): VINScannerConfiguration;
}
