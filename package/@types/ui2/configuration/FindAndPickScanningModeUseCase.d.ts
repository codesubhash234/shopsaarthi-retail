import { DeepPartial, PartiallyConstructible } from "./utils";
/**
 Configuration of the barcode to find and scan.
 */
export declare class ExpectedBarcode extends PartiallyConstructible {
    /**
     Value of the barcode to find. If not set, any barcode value will be accepted.
     */
    barcodeValue: string;
    /**
     Title of the barcode to find.
     */
    title: string;
    /**
     Image of the barcode to find.
     */
    image: string;
    /**
     Number of barcodes with given symbology/value required to scan.
     @defaultValue 1;
     */
    count: number;
    /** @param source {@displayType `DeepPartial<ExpectedBarcode>`} */
    constructor(source?: DeepPartial<ExpectedBarcode>);
}
