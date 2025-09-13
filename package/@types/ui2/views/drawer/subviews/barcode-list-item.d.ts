import React from "react";
import { Barcode } from "../../../../model/barcode/barcode";
import { BarcodeInfoPropsBase } from "../../barcode-info/barcode-info";
import { SwipeToDelete } from "../../../configuration";
export interface Props extends BarcodeInfoPropsBase {
    barcode: Barcode;
    onDelete: (barcode: Barcode) => void;
    readonlyCount: number | null;
    swipeToDeleteConfig: SwipeToDelete;
    sheetColor: string;
}
export default function BarcodeListItem(props: Props): React.JSX.Element;
