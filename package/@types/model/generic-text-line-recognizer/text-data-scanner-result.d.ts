export declare class TextDataScannerResult {
    text?: string;
    confidence?: number;
    validated?: boolean;
    static fromWorker(output: any): TextDataScannerResult;
}
