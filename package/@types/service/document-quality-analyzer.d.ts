import ScanbotSDK from '../scanbot-sdk';
import DocumentQualityAnalyzerResult from '../model/response/document-quality-analyzer-result';
export default class DocumentQualityAnalyzer {
    _token: string;
    _sdk: ScanbotSDK;
    constructor(sdk: ScanbotSDK, token: string);
    analyze(imageData: ArrayBuffer): Promise<DocumentQualityAnalyzerResult>;
    release(): Promise<void>;
}
