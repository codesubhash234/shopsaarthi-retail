import { Barcode } from "../../model/barcode/barcode";
import { Point } from "../../utils/dto/Point";
export declare class BarcodeOverlay {
    base64Image?: string;
    code: Barcode;
    points: Point[];
    highlighted: boolean;
    constructor(barcode: Barcode);
}
