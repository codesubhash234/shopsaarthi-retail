import React from "react";
import { BarcodeScannerConfiguration, BarcodeScannerResult } from "../configuration";
declare class Props {
    configuration: BarcodeScannerConfiguration;
    onCameraPermissionDenied: () => void;
    onSubmit: (barcodeScannerResult: BarcodeScannerResult) => void;
    onError: (error?: Error) => void;
    scanningEnabled: React.MutableRefObject<boolean>;
}
export declare function MultipleScanningModeController(props: Props): React.JSX.Element;
export {};
