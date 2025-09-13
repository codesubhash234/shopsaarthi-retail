import { Point } from "../../utils/dto/Point";
import { BarcodeFormat } from "./barcode-format";
export declare class Barcode {
    format: BarcodeFormat;
    text: string;
    parsedDocument: any;
    rawBytes: Uint8Array;
    points: Point[];
    barcodeImage: Uint8Array;
    constructor(format: BarcodeFormat, text: string, parsedDocument: string, bytes: Uint8Array, points: Point[], barcodeImage: Uint8Array);
    id(): string;
    equals(barcode: Barcode): unknown;
    static fromWorker(input: any): Barcode;
}
