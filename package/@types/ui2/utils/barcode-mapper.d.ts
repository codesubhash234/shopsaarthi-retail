/// <reference types="react" />
import { BarcodeItem, BarcodeItemMapper, BarcodeMappedData } from "../configuration";
import { Barcode } from "../../model/barcode/barcode";
export declare const BarcodeMapperContext: import("react").Context<BarcodeMapper>;
export type BarcodeMappedDataLoadingState = {
    value: BarcodeMappedData | null;
    state: 'LOADED' | 'LOADING' | 'RETRY_DIALOG_OPEN' | 'FAILED';
};
type OnEvictionListener = {
    barcode: Barcode;
    callback: () => void;
};
export declare class BarcodeMapper {
    private barcodeItemMapper;
    private onError;
    private readonly cache;
    private readonly cacheEntryPendingRetries;
    private hash;
    /**
     * When an error occurs, the onError callback is called with a retry and a cancel function. Until one of these
     * functions is called, the state of the getBarcodeMappedData will be "RETRY_DIALOG_OPEN".
     * If the retry function is called, all cached entries that are currently in this "RETRY_DIALOG_OPEN" state are cleared.
     */
    constructor(barcodeItemMapper: BarcodeItemMapper, onError: (retry: () => void, cancel: () => void) => void);
    mapBarcodeToBarcodeItem(barcode: Barcode, count: number): Promise<BarcodeItem>;
    /**
     * Results are cached.
     * Note that, because resulting promise will be used in useMemo, it is important we return the identical
     * promise for the same input (not just a promise with the same value).
     * Also note that we must not make this function async:
     *   If we do this, the function will only be evaluated once somebody awaits its result.
     *   It might be, that before that happens, the function is called again. In this case, the cache value will not
     *   have been set yet.
     * */
    private getBarcodeMappedData;
    useBarcodeMappedData(barcode: Barcode): BarcodeMappedDataLoadingState | null;
    private onEvictionListeners;
    addOnEvictionListener(listener: OnEvictionListener): void;
    removeOnEvictionListener(listener: OnEvictionListener): void;
}
export {};
