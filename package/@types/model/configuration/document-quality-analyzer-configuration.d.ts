export default class DocumentQualityAnalyzerConfiguration {
    /**
     * Patch size should be approx. 512-768. It governs the trade-off between speed and memory usage.
     * Smaller patch sizes use less memory but take longer. Defaults to 512.
     */
    patchSize: number;
    /**
     * Images with a side length larger than maxImageSize will be downscaled before analysing.
     * This is useful to reduce memory usage and processing time for large images.
     * Set to -1 to disable downscaling.
     */
    maxImageSize: number;
}
