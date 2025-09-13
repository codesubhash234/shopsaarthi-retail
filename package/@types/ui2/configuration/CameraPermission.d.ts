import { ButtonConfiguration } from "./Common";
import { DeepPartial, PartiallyConstructible } from "./utils";
import { IconStyle } from "./Common";
import { StyledText } from "./Common";
/**
 Configuration of the camera permission request view.
 */
export declare class CameraPermissionScreen extends PartiallyConstructible {
    /**
     Background color of the camera permission request.
     @defaultValue "?sbColorSurface";
     */
    background: string;
    /**
     Background color of the icon used in the camera permission request.
     @defaultValue "?sbColorOutline";
     */
    iconBackground: string;
    /**
     Configuration of the icon used in the camera permission request.
     @defaultValue new IconStyle({
      "visible": true,
      "color": "?sbColorOnSurface"
      });
     */
    icon: IconStyle;
    /**
     Configuration of the camera permission request's close button.
     @defaultValue new ButtonConfiguration({
        "text": "Close",
        "background": new BackgroundStyle({}),
        "foreground": new ForegroundStyle({})
    });
     */
    closeButton: ButtonConfiguration;
    /**
     Configuration of the camera permission request's title.
     @defaultValue new StyledText({
        "text": "Camera permission denied!",
        "color": "?colorOnSurface"
    });
     */
    enableCameraTitle: StyledText;
    /**
     Configuration of the camera permission request's explanatory text.
     @defaultValue new StyledText({
        "text": "Please allow the usage of the camera to start the scanning process.",
        "color": "?sbColorOnSurfaceVariant"
    });
     */
    enableCameraExplanation: StyledText;
    /** @param source {@displayType `DeepPartial<CameraPermissionScreen>`} */
    constructor(source?: DeepPartial<CameraPermissionScreen>);
}
