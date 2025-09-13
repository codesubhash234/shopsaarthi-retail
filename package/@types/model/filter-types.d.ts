export type BinarizationFilter = 'binarized' | 'otsuBinarization' | 'pureBinarized' | 'lowLightBinarization' | 'lowLightBinarization2' | 'deepBinarization';
export type ColorFilter = 'color' | 'gray' | 'colorDocument' | 'blackAndWhite' | 'edgeHighlight';
/**
 * @deprecated Use the new ImageProcessor API instead (see {@link ScanbotSDK.createImageProcessor}).
 */
export type ImageFilter = BinarizationFilter | ColorFilter;
