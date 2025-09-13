/// <reference types="react" />
import { BarcodeTextLocalization, Palette } from "./configuration";
export type getColorValueFunctionType = (colorValueFromConfig: string) => string;
export declare const SBPaletteContext: import("react").Context<{
    getColorValue: getColorValueFunctionType;
}>;
export declare function createSBPaletteContextValue(palette: Palette): {
    getColorValue: (color: string) => string;
};
export declare class SBTheme {
    private static palette;
    private static barcodeTextLocalization;
    static setPalette(palette: Palette): void;
    static setBarcodeTextLocalization(localization: BarcodeTextLocalization): void;
    static getColorValue(color: string): string;
    static getLocalizedBarcodeText(text: string): string;
}
