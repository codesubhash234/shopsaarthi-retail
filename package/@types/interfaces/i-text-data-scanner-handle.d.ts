import { IScannerCommon } from "./i-scanner-common-handle";
export interface ITextDataScannerHandle extends IScannerCommon {
    resumeDetection(): void;
    pauseDetection(): void;
    isDetectionPaused(): boolean;
}
