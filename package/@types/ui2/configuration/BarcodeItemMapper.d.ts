import { BarcodeMappedData } from "./BarcodeInfoMapping";
import { BarcodeItem } from "./BarcodeItem";
/**
 * Maps a barcode's data to the data of the corresponding product.
 * */
export type BarcodeItemMapper = (barcodeItem: BarcodeItem) => Promise<BarcodeMappedData>;
