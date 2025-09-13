import React from "react";
import { Barcode } from "../../model/barcode/barcode";
export default class BarcodeCalculationPopupList extends React.Component<any, any> {
    constructor(props: any);
    toUniqueListWithDuplicateCounter(barcodes: Barcode[]): Barcode[];
    update(barcodes: any): void;
    render(): React.ReactNode;
}
