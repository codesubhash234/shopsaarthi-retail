import { TextDataScannerResult } from "../generic-text-line-recognizer/text-data-scanner-result";
import { ViewFinderScannerConfiguration } from "./view-finder-scanner-configuration";
export type ValidatorPreset = "VehicleIdentificationNumber";
export type TextDetectionCallback = (e: TextDataScannerResult) => void;
export declare class TextDataScannerConfiguration extends ViewFinderScannerConfiguration {
    constructor();
    ocrResolutionLimit?: number;
    supportedLanguages?: string[];
    validatorPreset?: ValidatorPreset;
    /**
     * Simple validation string pattern
     *   - `?` = any character
     *   - `#` = any digit
     *   - all other characters represent themselves
     *
     * If matchSubstring is true, the scanned text will be truncated to a substring matching the pattern.
     * If matchSubstring is false, the scanned text will not be truncated. However, the results validated flag will
     *    only be set, if the entire scanned text matches the pattern.
     *
     * If validationPattern is empty, any scanned text will be accepted.
     *
     * validationPattern & validatorPreset cannot be used together.
     */
    validationPattern?: string;
    /** Controls if validationPattern should match the entire scanned text, or if it should find a matching substring. */
    matchSubstring?: boolean;
    allowedCharacters?: string;
    onTextDetected?: TextDetectionCallback;
    static fromJson(json: any): TextDataScannerConfiguration;
}
