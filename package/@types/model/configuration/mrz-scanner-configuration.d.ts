import { MrzResult } from "../mrz/mrz-result";
import { ViewFinderScannerConfiguration } from "./view-finder-scanner-configuration";
export interface MrzScannerAccumulatedFrameVerificationConfiguration {
    /** Maximum number of accumulated frames to inspect to verify a scan result */
    maximumNumberOfAccumulatedFrames?: number;
    /** Minimum number of accumulated frames that have an equal result,
     *  in order for the result to be considered verified */
    minimumNumberOfRequiredFramesWithEqualRecognitionResult?: number;
}
export declare class MrzScannerConfiguration extends ViewFinderScannerConfiguration {
    constructor();
    accumulatedFrameVerificationConfiguration?: MrzScannerAccumulatedFrameVerificationConfiguration;
    onMrzDetected?: (e: MrzResult) => void;
    _onDetectionFailed?: (e: ImageData) => void;
    static fromJson(json: any): MrzScannerConfiguration;
}
