import React from "react";
import ScanbotCameraView from "../scanbot-camera-view";
import { Barcode } from "../../model/barcode/barcode";
import { BarcodeOverlay } from "./barcode-overlay";
import BarcodePolygon from "./barocode-polygon";
import BarcodePolygonLabel from "./barcode-polygon-label";
import { SelectionOverlayConfiguration } from "../../model/configuration/selection-overlay-configuration";
import { ArOverlayBarcodeInfo, AROverlayBarcodeInfoConfig } from "../../ui2/views/ar/ar-overlay-barcode-info";
import { Frame } from "../../utils/dto/Frame";
export declare class BarcodePolygonElement {
    element: BarcodeOverlay;
    updatedAt?: number;
    polygon: JSX.Element;
    label: JSX.Element;
    polygonRef?: BarcodePolygon;
    labelRef?: BarcodePolygonLabel | ArOverlayBarcodeInfo;
}
export declare class SelectionOverlayProps {
    style?: React.CSSProperties;
    configuration?: SelectionOverlayConfiguration;
    onPolygonSelected?: (code: Barcode) => void;
    onPolygonClick?: (code: Barcode) => void;
    onBarcodeFound?: (code: Barcode, polygon: BarcodePolygon, label: BarcodePolygonLabel) => void;
    LabelComponent: (typeof BarcodePolygonLabel | typeof ArOverlayBarcodeInfo);
    labelComponentConfig: {} | AROverlayBarcodeInfoConfig;
}
export default class AnimatedBarcodeSelectionOverlay extends React.Component<SelectionOverlayProps, any> {
    constructor(props: SelectionOverlayProps);
    update(finderRect: Frame, camera: ScanbotCameraView, imageData: ImageData, container: any, codes: Barcode[]): void;
    onPolygonClick(model: BarcodeOverlay): void;
    render(): React.ReactNode;
}
