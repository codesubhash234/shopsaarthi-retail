import * as Config from "./configuration";
import { BarcodeScannerConfiguration, BarcodeScannerResult } from "./configuration";
export default class ScanbotSDKUI {
    static createBarcodeScanner(config: BarcodeScannerConfiguration): Promise<BarcodeScannerResult | null>;
    private static createContainer;
    static readonly Config: typeof Config;
}
