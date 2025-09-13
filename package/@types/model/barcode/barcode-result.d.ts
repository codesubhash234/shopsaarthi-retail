import { ImageDataWrapper } from "../image-data-wrapper";
import { Barcode } from "./barcode";
export declare class BarcodeResult {
    barcodes: Barcode[];
    imageData: ImageData;
    constructor(barcodes: Barcode[], imageData: ImageData);
    /** @internal */
    static fromWorker(inputs: any[], image: ImageDataWrapper): BarcodeResult;
    isEmpty(): boolean;
}
