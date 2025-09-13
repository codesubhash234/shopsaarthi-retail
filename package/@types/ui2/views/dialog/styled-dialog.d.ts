import { DialogProps } from "@mui/material";
import React from "react";
interface Props extends Omit<DialogProps, "componentsProps"> {
    modalOverlayColor: string;
}
export declare function StyledDialog({ modalOverlayColor, ...props }: Props): React.JSX.Element;
export {};
