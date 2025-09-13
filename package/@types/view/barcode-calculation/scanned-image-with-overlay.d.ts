import React, { ReactNode } from "react";
import { BarcodeResult } from "../../model/barcode/barcode-result";
export default class ScannedImageWithOverlay extends React.Component<any, any> {
    image: HTMLImageElement | undefined;
    constructor(props: any);
    update(result: BarcodeResult): void;
    reset(): void;
    render(): ReactNode;
}
