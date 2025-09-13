import React from "react";
import { Barcode } from "../../model/barcode/barcode";
export default class BottomActionBar extends React.Component<any, any> {
    constructor(props: any);
    update(barcodes: Barcode[]): void;
    didScan(): boolean;
    render(): React.ReactNode;
}
