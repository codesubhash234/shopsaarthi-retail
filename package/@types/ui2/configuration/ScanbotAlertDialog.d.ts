import { ButtonConfiguration } from "./Common";
import { DeepPartial, PartiallyConstructible } from "./utils";
import { StyledText } from "./Common";
/**
 Configuration of the the standard alert dialog.
 */
export declare class ScanbotAlertDialog extends PartiallyConstructible {
    /**
     Title displayed above the message.
     @defaultValue new StyledText({
      "text": "Title",
      "color": "?sbColorOnSurface"
      });
     */
    title: StyledText;
    /**
     Explanation message message.
     @defaultValue new StyledText({
        "text": "Standard explanation message text.",
        "color": "?sbColorOnSurfaceVariant"
    });
     */
    subtitle: StyledText;
    /**
     Background color of the alert dialog.
     @defaultValue "?sbColorSurface";
     */
    sheetColor: string;
    /**
     Dialog overlay color.
     @defaultValue "?sbColorModalOverlay";
     */
    modalOverlayColor: string;
    /**
     Color of the divider line.
     @defaultValue "?sbColorOutline";
     */
    dividerColor: string;
    /**
     Configuration of the retry button.
     */
    okButton: ButtonConfiguration;
    /**
     Configuration of the cancel button.
     */
    cancelButton: ButtonConfiguration;
    /** @param source {@displayType `DeepPartial<ScanbotAlertDialog>`} */
    constructor(source?: DeepPartial<ScanbotAlertDialog>);
}
