export type DocumentQuality = "NO_DOCUMENT" | "VERY_POOR" | "POOR" | "REASONABLE" | "GOOD" | "EXCELLENT";
export default interface DocumentQualityAnalyzerResult {
    /**
    * Result of document quality analysis.
    * It is used to determine if the document is good enough to be used for OCR processing.
    */
    quality: DocumentQuality;
}
