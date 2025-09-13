import { VideoSize } from "../../utils/dto/VideoSize";
import { ContourDetectionResult } from "./contour-detection-result";
export declare class DocumentDetectionResult extends ContourDetectionResult {
    cropped?: Uint8Array;
    original: Uint8Array;
    videoSize: VideoSize;
    constructor(contourDetectionResult?: ContourDetectionResult);
}
