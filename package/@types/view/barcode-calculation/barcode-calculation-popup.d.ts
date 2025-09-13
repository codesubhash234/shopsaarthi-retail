import React, { CSSProperties } from "react";
import { Barcode } from "../../model/barcode/barcode";
import BarcodeCalculationPopupList from "./barcode-calculation-popup-list";
export declare enum AnimationType {
    None = 0,
    PushRight = 1,
    PushBottom = 2,
    Pop = 3
}
export default class BarcodeCalculationPopup extends React.Component<any, any> {
    list: BarcodeCalculationPopupList;
    previousDestination?: string;
    barcodes?: Barcode[];
    constructor(props: any);
    containerStyle(transform: string): CSSProperties;
    render(): React.ReactNode;
    reset(): void;
    private _isVisible;
    isVisible(): boolean;
    push(type: AnimationType, barcodes: Barcode[]): void;
    update(barcodes: Barcode[]): void;
    pop(): void;
    onAnimationStart(): void;
    onAnimationEnd(): void;
    pushType?: AnimationType;
    updateAnimationType(type: AnimationType, callback?: any): void;
    animation(type: AnimationType): import("styled-components").IStyledComponent<"web", import("styled-components/dist/types").FastOmit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, never>>;
    from(type: AnimationType): string;
    to(type: AnimationType): string;
    translate(axis: "X" | "Y", percentage: number): string;
    componentWillUnmount(): void;
}
