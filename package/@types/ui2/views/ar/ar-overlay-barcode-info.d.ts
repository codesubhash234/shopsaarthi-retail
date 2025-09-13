import React from "react";
import BarcodePolygonLabel, { BarcodePolygonLabelProps } from "../../../view/barcode-polygon/barcode-polygon-label";
import { BadgeStyle, BarcodeItemConfiguration, BarcodeItemInfoPosition } from "../../configuration";
export type AROverlayBarcodeInfoConfig = {
    barcodeItemConfiguration: BarcodeItemConfiguration;
    barcodeItemInfoPosition: BarcodeItemInfoPosition;
    counterBadge: BadgeStyle;
};
declare class AROverlayBarcodeInfoProps extends BarcodePolygonLabelProps implements AROverlayBarcodeInfoConfig {
    barcodeItemConfiguration: BarcodeItemConfiguration;
    barcodeItemInfoPosition: BarcodeItemInfoPosition;
    counterBadge: BadgeStyle;
}
export declare class ArOverlayBarcodeInfo extends BarcodePolygonLabel<AROverlayBarcodeInfoProps> {
    private count;
    setCount: (count: number) => void;
    render(): React.ReactNode;
}
export {};
