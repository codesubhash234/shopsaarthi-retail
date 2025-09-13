import React from "react";
import { ManualCountEditDialog } from "../../configuration";
import { CountedBarcode, CountedBarcodeAction } from "../../model/counted-barcodes";
interface Props {
    barcode: CountedBarcode | null;
    setCounter: (action: CountedBarcodeAction) => void;
    onCancel: () => void;
    dialogStyling: ManualCountEditDialog;
}
export declare function CountEditDialog(props: Props): React.JSX.Element;
export {};
