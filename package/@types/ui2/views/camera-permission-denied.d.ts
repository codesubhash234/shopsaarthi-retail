import React from "react";
import { CameraPermissionScreen } from "../configuration/CameraPermission";
interface Props {
    onAppClose: () => void;
    config: CameraPermissionScreen;
}
export declare function CameraPermissionDenied(props: Props): React.JSX.Element;
export {};
