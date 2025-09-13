import ScanbotSDK from '../scanbot-sdk';
import { ImageProcessor } from "./image-processor";
export interface TiffGenerationOptions {
    dpi?: number;
}
export default class TiffGenerator {
    private _tiffOperation;
    private _sdk;
    /** @internal */
    constructor(sdk: ScanbotSDK, tiffOperation: string);
    /**
     * @param image Can be either an ArrayBuffer containing the JPEG or PNG encoded image data, or an ImageProcessor instance.
     */
    addPage(image: ArrayBuffer | ImageProcessor): Promise<void>;
    complete(): Promise<ArrayBuffer>;
}
