import { DocumentDetectionResult } from "../model/document/document-detection-result";
import { IScannerCommon } from "./i-scanner-common-handle";
export interface IDocumentScannerHandle extends IScannerCommon {
    detectAndCrop(): Promise<DocumentDetectionResult>;
    enableAutoCapture(): void;
    disableAutoCapture(): void;
    isAutoCaptureEnabled(): boolean;
}
