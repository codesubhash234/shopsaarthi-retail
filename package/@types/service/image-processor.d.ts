import ScanbotSDK from "../scanbot-sdk";
import { ParametricFilter } from "../core/compiled/ParametricFilters";
import { Polygon } from "../utils/dto/Polygon";
export type Rotation = "ROTATION_NONE" | "ROTATION_90_CLOCKWISE" | "ROTATION_180" | "ROTATION_90_COUNTERCLOCKWISE";
export declare class ImageProcessor {
    private _sdk;
    private _token;
    /** @internal */
    constructor(_sdk: ScanbotSDK, _token: string);
    copy(): Promise<ImageProcessor>;
    /**
     * Applies the given filter to the image.
     * See {@link ParametricFilter} for available filters.
     * @example
     * imageProcessor.applyFilter(new sdk.imageFilters.ScanbotBinarizationFilter());
     * */
    applyFilter(filter: ParametricFilter): Promise<void>;
    /**
     * Crops the image to the given polygon.
     *    The polygon is defined by an array of four points, each point being an object with `x` and `y` coordinates.
     *    Each coordinate is a floating point number between 0 and 1, representing the percentage of the image width and height, respectively.
     *    @example
     *    // Crop an image to the center 80% of the image:
     *    imageProcessor.crop([{x: 0.1, y: 0.1}, {x: 0.9, y: 0.1}, {x: 0.9, y: 0.9}, {x: 0.1, y: 0.9}])
     */
    crop(polygon: Polygon): Promise<void>;
    /** Resizes image, keeping aspect ratio, so that the biggest side of the image is equal to `destinationSize`. */
    resize(destinationSize: number): Promise<void>;
    rotate(rotation: Rotation): Promise<void>;
    /** Returns the processed image as a JPEG encoded ArrayBuffer. */
    processedImage(): Promise<ArrayBuffer>;
    release(): Promise<void>;
    /** @internal */
    get __token(): string;
}
