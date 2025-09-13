import { BarcodeResult } from "../model/barcode/barcode-result";
import { ImageDataWrapper } from "../model/image-data-wrapper";
export default class Networking {
    static postBlob(url: string, blob: Blob): Promise<any>;
    static postImage(url: string, imageData: ImageDataWrapper): Promise<any>;
    static recognizeBarcodes(url: string, imageData: ImageDataWrapper): Promise<BarcodeResult>;
}
