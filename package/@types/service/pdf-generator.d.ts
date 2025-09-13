import ScanbotSDK from '../scanbot-sdk';
/**
 *     "LETTER"         8.5 x 11 (inches)        612 x 792 (pixels) at 72 DPI<br>
 *     "LEGAL"          8.5 x 14 (inches)        612 x 1008 (pixels) at 72 DPI<br>
 *     "A3"             297 x 420 (mm)           841.89 x 1199.551 (pixels) at 72 DPI<br>
 *     "A4"             210 x 297 (mm)           595.276 x 841.89 (pixels) at 72 DPI<br>
 *     "A5"             148 x 210 (mm)           419.528 x 595.276 (pixels) at 72 DPI<br>
 *     "B4"             250 x 353 (mm)           708.661 x 1000.63 (pixels) at 72 DPI<br>
 *     "B5"             176 x 250 (mm)           498.898 x 708.661 (pixels) at 72 DPI<br>
 *     "EXECUTIVE"      7.25 x 10.5 (inches)     522 x 756 (pixels) at 72 DPI<br>
 *     "US4x6"          4 x 6 (inches)           288 x 432 (pixels) at 72 DPI<br>
 *     "US4x8"          4 x 8 (inches)           288 x 576 (pixels) at 72 DPI<br>
 *     "US5x7"          5 x 7 (inches)           360 x 504 (pixels) at 72 DPI<br>
 *     "COMM10"         4.125 x 9.5 (inches)     297 x 684 (pixels) at 72 DPI<br>
 *     "CUSTOM"         physical size will be calculated from the image dimensions and the `dpi` parameter.
 */
export type PageSize = "LETTER" | "LEGAL" | "A3" | "A4" | "A5" | "B4" | "B5" | "EXECUTIVE" | "US4x6" | "US4x8" | "US5x7" | "COMM10" | "CUSTOM";
/**
 * AUTO – decides based on image aspect ratio
 */
export type PageDirection = "PORTRAIT" | "LANDSCAPE" | "AUTO";
/**
 * FIT_IN – Fit image into page. May leave white borders if the aspect ratio of the image and the page don't match. Preserves image aspect ratio. <br>
 * FILL_IN – Fill page with image. Will crop the image if the aspect ratio of the image and the page don't match. Preserves image aspect ratio.<br>
 * STRETCH – Stretch image to fill the entire page. The image will never be cropped and there will never be any white borders left, but the image aspect ratio will be made to match the page aspect ratio. <br>
 * NONE – No resizing, centers the image on the page. The physical size of the image will be determined by the `dpi` parameter.
 */
export type PageFit = "FIT_IN" | "FILL_IN" | "STRETCH" | "NONE";
/**
 * The parameters `pageSize`, `pageFit`, `dpi` and `resample` interact in a complex way
 * when adding bitmap images (JPEG, PNG, or raw) to the PDF.
 * There are three cases to consider:
 * 1. `pageSize` is `CUSTOM`:
 *    in this case `dpi` is used as the conversion ratio to calculate both the physical page and
 *    image sizes in inches from the bitmap dimensions. `resample` is ignored.
 * 2. `pageSize` is not `CUSTOM` AND `pageFit` is `NONE`:
 *    in this case `dpi` is used as the conversion ratio to calculate only the physical image
 *    size in inches from the bitmap dimensions. The image is centered onto the page. `resample` is
 *    ignored.
 * 3. `pageSize` is not `CUSTOM` AND `pageFit` is not `NONE`:
 *    in this case the page has a pre-determined physical size and we want to stretch the image to
 *    fit the page in one of the ways described by `pageFit`. The image DPI is automatically
 *    calculated for each image from the given physical page size, page fit setting and image
 *    dimensions. There are two sub-cases to consider:
 *    a. `resample` is false OR the calculated DPI is less than or equal to `dpi`:
 *       in this case the image is added to the PDF without resampling, which means that the image
 *       rectangle is simply rescaled to fit into the page as specified by `pageFit` and
 *       `pageSize`.
 *    b. `resample` is true AND the calculated DPI is greater than `dpi`:
 *       in this case the bitmap of the image is resampled to match `dpi` before adding it to the
 *       PDF. This will result in a bitmap that is smaller than the original image and hence, the
 *       resulting PDF will be smaller in size.
 */
export interface PdfGenerationOptions {
    /** Physical size of the page. If CUSTOM, the page size will be set as the image size at given dpi.
     * Default value: A4
     * */
    standardPaperSize?: PageSize;
    /** Default value: PORTRAIT */
    pageDirection?: PageDirection;
    /** How to fit the image into the page. Only used if `pageSize` is not `CUSTOM`.
     * The image can either be stretched to fill the page, in one of three ways, or
     * centered on the page without stretching.
     * Default value: FIT_IN
     */
    pageFit?: PageFit;
    /** The `dpi` parameter has two different meanings depending on the value of `pageSize` and
     * `pageFit`. If pageSize is CUSTOM or pageFit is NONE, then `dpi` is the conversion ratio used
     * to convert from units of pixels to physical inches when adding bitmap images (JPEG, PNG, or
     * raw) to the PDF. Otherwise, if `resample` is true, then the image is downscaled if necessary
     * (if the image after being fit to the page has a higher calculated DPI than `dpi`) to match
     * `dpi` before adding it to the PDF. Otherwise, the setting is ignored and the calculated
     * image DPI is used instead.
     * Default value: 72
     */
    dpi?: number;
    /** JPEG quality for images.
     * Applies if an image is added as a cv::Mat and therefore needs to be encoded.
     * Also applies if `resample` is true and the image being added needs to be downscaled.
     * Otherwise, when adding JPEG files to the PDF, the files are copied directly into the PDF and
     * not re-encoded, which is many times faster and also preserves the quality of the original.
     * Default value: 80
     */
    jpegQuality?: number;
    /** false: always geometrically rescale the image to fit the page if necessary. Fast.
     * true: downscale the bitmap to match the `dpi` setting before adding it to the PDF if
     *       the calculated image DPI after stretching is greater than `dpi`. Slower.
     * Default value: false
     */
    resample?: boolean;
}
export default class PdfGenerator {
    _pdfOperation: string;
    _sdk: ScanbotSDK;
    /** @internal */
    constructor(sdk: ScanbotSDK, pdfOperation: string);
    addPage(imageBuffer: ArrayBuffer): Promise<void>;
    complete(): Promise<ArrayBuffer>;
}
