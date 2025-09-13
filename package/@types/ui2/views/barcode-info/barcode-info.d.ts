import React from "react";
import { StyledText as StyledTextConfig } from "../../configuration";
import { BarcodeMappedDataLoadingState } from "../../utils/barcode-mapper";
export interface CounterForm {
    counter: number;
    setCounter: (counter: number) => void;
    onNumberClick: () => void;
    manualCountOutlineColor: string;
    manualCountChangeColor: string;
}
export interface BarcodeInfoPropsBase {
    barcodeImageVisible: boolean;
    maxNumberOfTitleLines: number;
    maxNumberOfSubtitleLines: number;
    imageSize: number;
    displayRightArrow: boolean;
    counterForm?: CounterForm;
    barcodeTitle: StyledTextConfig;
    barcodeSubtitle: StyledTextConfig;
}
export interface BarcodeInfoProps extends BarcodeInfoPropsBase {
    barcodeMappedData: BarcodeMappedDataLoadingState | null;
}
export declare function BarcodeInfo(props: BarcodeInfoProps): React.JSX.Element;
