import { BarcodeItem } from "./BarcodeItem";
import { DeepPartial, PartiallyConstructible } from "./utils";
/**
 Results of the barcode scan.
 */
export declare class BarcodeScannerResult extends PartiallyConstructible {
    /**
     Recognized barcode items.
     @defaultValue [];
     */
    items: BarcodeItem[];
    /** @param source {@displayType `DeepPartial<BarcodeScannerResult>`} */
    constructor(source?: DeepPartial<BarcodeScannerResult>);
}
