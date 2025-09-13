import React from "react";
import { BarcodeScannerConfiguration, BarcodeScannerResult } from "../configuration";
declare class Props {
    configuration: BarcodeScannerConfiguration;
    onClose: () => void;
    onSubmit: (barcodeScannerResult: BarcodeScannerResult) => void;
    onError: (error?: Error) => void;
    onCameraPermissionDenied: () => void;
    scanningEnabled: React.MutableRefObject<boolean>;
}
export declare function SingleScanningModeController(props: Props): React.JSX.Element;
export {};
