import React from "react";
import { ButtonProps } from "../../../utils/styled-button";
import { StyledText as StyledTextConfig } from "../../../configuration/Common";
export declare class DrawerHeaderContentProps {
    numBarcodes: number;
    leftButton: ButtonProps;
    rightButton: ButtonProps;
    title: StyledTextConfig;
}
export declare function DrawerHeaderContent(props: DrawerHeaderContentProps): React.JSX.Element;
