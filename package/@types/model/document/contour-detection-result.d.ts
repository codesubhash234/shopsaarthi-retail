import { MagneticLine } from "../../utils/dto/MagneticLine";
import { Polygon } from "../../utils/dto/Polygon";
import { DetectionStatus } from "./detection-status";
export declare class ContourDetectionResult {
    horizontalLines?: MagneticLine[];
    verticalLines?: MagneticLine[];
    polygon?: Polygon;
    detectionStatus?: DetectionStatus;
    success?: boolean;
    /**
     * Average brightness, calculated as the average
     * of the Value channel in the HSV color space of:
     *  - the whole image, if no document was detected
     *  - the document crop, if a document was detected
     * Ranges from 0 to 255
     */
    averageBrightness?: number;
    constructor(contourDetectionResult?: ContourDetectionResult);
}
