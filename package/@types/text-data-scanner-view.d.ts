import React from "react";
import { ScanbotCameraProps, ScanbotCameraState, ScannerView } from "./scanner-view";
import { ITextDataScannerHandle } from "./interfaces/i-text-data-scanner-handle";
import ViewFinder from "./view/view-finder";
import TextDataScanner from "./service/text-data-recognizer";
import { TextDetectionCallback } from "./model/configuration/text-data-scanner-configuration";
import { ViewFinderScannerConfiguration } from "./model/configuration/view-finder-scanner-configuration";
export declare class TextDataScannerProps extends ScanbotCameraProps {
    textDataScanner: TextDataScanner;
    onTextDetected: TextDetectionCallback;
}
export declare class TextDataScannerState extends ScanbotCameraState {
    isFinderVisible?: boolean;
}
export default class TextDataScannerView extends ScannerView<TextDataScannerProps, TextDataScannerState> implements ITextDataScannerHandle {
    static FRAME_RESOLUTION: number;
    finder?: ViewFinder;
    shouldComputeSize: boolean;
    private paused;
    constructor(props: TextDataScannerProps);
    get configuration(): ViewFinderScannerConfiguration;
    get enabled(): boolean;
    /**
     * Public API functions
     */
    static create(configuration: ViewFinderScannerConfiguration, onTextDetected: TextDetectionCallback, textDataScanner: TextDataScanner): Promise<TextDataScannerView>;
    isDetectionPaused(): boolean;
    resumeDetection(): Promise<void>;
    pauseDetection(): void;
    private readonly updateDimensionsCallback;
    /**
     * React Overrides
     */
    componentDidMount(): Promise<void>;
    componentWillUnmount(): void;
    updateDimensions(): Promise<void>;
    resume(): Promise<void>;
    pause(): void;
    detect(): Promise<void>;
    saveExtractedImageData(): void;
    render(): React.JSX.Element;
}
