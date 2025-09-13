import { TextDataScannerResult } from '../model/generic-text-line-recognizer/text-data-scanner-result';
import ScanbotSDK from '../scanbot-sdk';
export default class TextDataScanner {
    private _sdk;
    private _textDataScannerToken;
    constructor(_sdk: ScanbotSDK, _textDataScannerToken: Promise<string>);
    recognize(imageData: ImageData): Promise<TextDataScannerResult>;
    cleanRecognitionQueue(): Promise<void>;
    recognizeURL(imageURL: string): Promise<TextDataScannerResult>;
    release(): Promise<void>;
}
