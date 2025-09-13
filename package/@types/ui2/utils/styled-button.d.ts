import React from "react";
import { ButtonConfiguration } from "../configuration";
export interface ButtonProps extends ButtonConfiguration {
    onClick: () => void;
    icon?: React.ReactNode;
}
export declare function StyledButton(props: ButtonProps): React.JSX.Element;
