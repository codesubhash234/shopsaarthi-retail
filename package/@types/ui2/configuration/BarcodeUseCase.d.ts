import { MultipleScanningMode } from "./MultipleScanningModeUseCase";
import { SingleScanningMode } from "./SingleScanningModeUseCase";
export type BarcodeUseCase = SingleScanningMode | MultipleScanningMode;
/** @internal */
export declare namespace BarcodeUseCase {
    /** @internal */
    function From(source: {
        [key: string]: any;
    }): BarcodeUseCase;
}
