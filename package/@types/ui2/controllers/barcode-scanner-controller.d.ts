import React from 'react';
import { BarcodeScannerConfiguration, BarcodeScannerResult } from '../configuration';
export declare class Props {
    configuration: BarcodeScannerConfiguration;
    onClose: () => void;
    onSubmit: (barcodeScannerResult: BarcodeScannerResult) => void;
    onError: (error: Error) => void;
}
export declare function BarcodeScannerController(props: Props): React.JSX.Element;
