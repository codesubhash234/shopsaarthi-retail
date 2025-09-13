import { Barcode } from "../../model/barcode/barcode";
import BarcodePolygon from "../../view/barcode-polygon/barocode-polygon";
import { ArOverlayBarcodeInfo } from "../views/ar/ar-overlay-barcode-info";
export type CountedBarcode = {
    barcode: Barcode;
    count: number;
    labelElement?: ArOverlayBarcodeInfo;
    polygonElement?: BarcodePolygon;
};
/**
 * Function that takes the current count of a barcode and returns its new count.
 * `oldCount` is 0 if the barcode is not yet in the list of barcodes.
 **/
type ComputeNewCountFunction = (oldCount: number) => number;
export type CountedBarcodeAction = {
    type: 'setCount';
    barcodes: Barcode[];
    computeNewCount: ComputeNewCountFunction;
} | {
    type: 'remove';
    barcode: Barcode;
} | {
    type: 'clear';
} | {
    type: 'setHtmlElements';
    barcode: Barcode;
    labelElement: ArOverlayBarcodeInfo;
    polygonElement: BarcodePolygon;
};
export declare const barcodesEqual: (a: Barcode, b: Barcode) => boolean;
export declare function countedBarcodesReducer(countedBarcodes: Readonly<Readonly<CountedBarcode>[]>, action: CountedBarcodeAction): CountedBarcode[];
export {};
