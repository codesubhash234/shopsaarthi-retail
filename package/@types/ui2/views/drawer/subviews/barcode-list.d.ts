import React from "react";
import { CountedBarcode, CountedBarcodeAction } from "../../../model/counted-barcodes";
import { MultipleBarcodesScanningMode, SheetContent } from "../../../configuration";
interface Props {
    barcodes: CountedBarcode[];
    onBarcodeChange: (action: CountedBarcodeAction) => void;
    onNumberClick: (countedBarcode: CountedBarcode) => void;
    sheetContent: SheetContent;
    mode: MultipleBarcodesScanningMode;
}
export declare function BarcodeList(props: Props): React.JSX.Element;
export {};
