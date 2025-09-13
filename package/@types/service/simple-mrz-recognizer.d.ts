import { MrzResult } from '../model/mrz/mrz-result';
import ScanbotSDK from '../scanbot-sdk';
export default class SimpleMrzRecognizer {
    private _sdk;
    private _mrzRecognizerToken;
    private enableFrameAccumulation;
    constructor(_sdk: ScanbotSDK, _mrzRecognizerToken: Promise<string>, enableFrameAccumulation: boolean);
    recognize(imageData: ImageData | ArrayBuffer): Promise<MrzResult | undefined>;
    recognizeURL(imageURL: string): Promise<MrzResult | undefined>;
    release(): Promise<void>;
}
