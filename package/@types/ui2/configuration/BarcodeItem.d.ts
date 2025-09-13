import { BarcodeFormat } from "./BarcodeRecognizerConfiguration";
import { DeepPartial, PartiallyConstructible } from "./utils";
import { GenericDocument } from "./utils";
/**
 Data about the scanned barcode.
 */
export declare class BarcodeItem extends PartiallyConstructible {
    /**
     Recognized barcode symbology.
     */
    type: BarcodeFormat;
    /**
     Number of recognized barcodes of this symbology and value.
     */
    count: number;
    /**
     Recognized value of the barcode.
     */
    text: string;
    /**
     Array of raw bytes that compose the recognized barcode.
     */
    rawBytes: string;
    /**
     The parsed known document format (if parsed successfully).
     */
    parsedDocument: GenericDocument;
    /** @param source {@displayType `DeepPartial<BarcodeItem>`} */
    constructor(source?: DeepPartial<BarcodeItem>);
}
