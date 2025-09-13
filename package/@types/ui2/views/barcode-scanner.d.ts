import React from "react";
import { Barcode } from "../../model/barcode/barcode";
import { ArOverlayGeneralConfiguration } from "../configuration/ArTrackingOverlayConfiguration";
import { ActionBarConfiguration } from "../configuration/ActionBarConfiguration";
import { BarcodeScannerConfiguration as BarcodeScannerViewConfig } from "../../model/configuration/barcode-scanner-configuration";
import { ViewFinderPadding } from "../../view/view-finder";
import BarcodePolygon from "../../view/barcode-polygon/barocode-polygon";
import BarcodePolygonLabel from "../../view/barcode-polygon/barcode-polygon-label";
import { CameraConfiguration } from "../configuration/CameraConfiguration";
export declare class Props {
    cameraConfiguration: CameraConfiguration;
    arOverlay: ArOverlayGeneralConfiguration;
    actionBarConfig: ActionBarConfiguration;
    actionBarBottomPadding: number;
    arOnBarcodeEnter: (code: Barcode, polygon: BarcodePolygon, label: BarcodePolygonLabel) => void;
    arOnBarcodeClick: (barcode: Barcode) => void;
    scanningPaused: boolean;
    barcodeScannerViewConfig: BarcodeScannerViewConfig;
    viewFinderPadding: ViewFinderPadding;
    containerId: string;
    onCameraPermissionDenied: () => void;
    setActionButtonsVisible: (visible: boolean) => void;
    onLicenseError?: () => void;
}
export declare function BarcodeScanner(props: Props): React.JSX.Element;
