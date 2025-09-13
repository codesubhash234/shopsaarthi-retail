import ScanbotSDK from '../scanbot-sdk';
export interface Rect {
    x: number;
    y: number;
    height: number;
    width: number;
}
export interface OcrData {
    text: string;
    confidence: number;
    boundingBox: Rect;
}
export default class OcrEngine {
    _OcrEngineToken: string;
    _sdk: ScanbotSDK;
    constructor(sdk: ScanbotSDK, OcrEngineToken: string);
    performOcr(imageData: ImageData): Promise<OcrData[]>;
    recognizeURL(imageURL: string): Promise<any>;
    release(): Promise<void>;
}
