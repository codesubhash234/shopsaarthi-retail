import React from "react";
import "../styles/main.css";
import AnimatedDocumentPolygon from "./polygon/animated-document-polygon";
import { ShutterButtonAction } from "./shutter-button";
import { OutlineStyleConfiguration } from "../model/configuration/document-scanner-configuration";
export interface DocumentOutlineProps {
    style?: OutlineStyleConfiguration;
    action?: ShutterButtonAction;
    autoCaptureSensitivity?: number;
}
export declare class DocumentOutline extends React.Component<DocumentOutlineProps, any> {
    hintLabelClassName: string;
    polygon: AnimatedDocumentPolygon | null;
    label: HTMLLabelElement | null;
    state: {
        text: string;
        ok: boolean;
        validPoints: boolean;
    };
    render(): React.JSX.Element;
    update(ok: boolean, points: any[], text: string): void;
}
