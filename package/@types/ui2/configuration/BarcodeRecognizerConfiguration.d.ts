import { DeepPartial, PartiallyConstructible } from "./utils";
/**
 Expected quantity of QR codes in an image.

 - `LOW`:
 Up to 6 QR codes per image.
 - `HIGH`:
 Up to 24 QR codes per image.
 */
export type CodeDensity = "LOW" | "HIGH";
/**
 Type of MSI plessey checksum algorithm used.

 - `NONE`:
 No checksum algorithm used.
 - `MOD_10`:
 Mod10 checksum algorithm
 - `MOD_11_IBM`:
 Mod11IBM checksum algorithm
 - `MOD_11_NCR`:
 Mod11NCR checksum algorithm
 - `MOD_1010`:
 Mod1010 checksum algorithm
 - `MOD_1110_IBM`:
 Mod1110IBM checksum algorithm
 - `MOD_1110_NCR`:
 Mod1110NCR checksum algorithm
 */
export type MSIPlesseyChecksumAlgorithm = "NONE" | "MOD_10" | "MOD_11_IBM" | "MOD_11_NCR" | "MOD_1010" | "MOD_1110_IBM" | "MOD_1110_NCR";
/**
 GS1_COMPOSITE barcode type handling

 - `NONE`:
 No special handling for GS1-formatted results. Special (FNC1) characters are stripped.
 - `PARSE`:
 GS1 messages are converted to machine-readable format per the GS1 spec (the special character is converted to ASCII \x1D). Message is not validated. The implied 01 AI key is prepended to DataBar results.
 - `VALIDATE`:
 GS1 messages are converted to machine-readable format per the GS1 spec (the special character is converted to ASCII \x1D) and validated. The implied 01 AI key is prepended to DataBar results. Invalid messages are not returned.
 - `DECODE`:
 GS1 strings are converted to human-readable format and validated. The implied (01) AI key is prepended to DataBar results. Invalid messages are not returned.
 */
export type Gs1Handling = "NONE" | "PARSE" | "VALIDATE" | "DECODE";
/**
 Type of barcode document format used.

 - `AAMVA`:
 American Association of Motor Vehicle Administrators barcode document
 - `BOARDING_PASS`:
 Boarding pass barcode document
 - `DE_MEDICAL_PLAN`:
 German medication plan barcode document
 - `MEDICAL_CERTIFICATE`:
 German medical certificate barcode document
 - `ID_CARD_PDF_417`:
 ID card barcode document
 - `SEPA`:
 SEPA barcode (aka GiroCode) document
 - `SWISS_QR`:
 Swiss QR barcode document
 - `VCARD`:
 VCard barcode document
 - `GS1`:
 GS1 barcode document
 */
export type BarcodeDocumentFormat = "AAMVA" | "BOARDING_PASS" | "DE_MEDICAL_PLAN" | "MEDICAL_CERTIFICATE" | "ID_CARD_PDF_417" | "SEPA" | "SWISS_QR" | "VCARD" | "GS1";
/**
 Barcode symbology used.

 - `AZTEC`:
 Aztec barcode type
 - `CODABAR`:
 Codabar barcode type
 - `CODE_25`:
 Code 25 barcode type
 - `CODE_39`:
 Code 39 barcode type
 - `CODE_93`:
 Code 93 barcode type
 - `CODE_128`:
 Code 128 barcode type
 - `DATA_MATRIX`:
 Data Matrix barcode type
 - `EAN_8`:
 EAN-8 barcode type
 - `EAN_13`:
 EAN-13 barcode type
 - `ITF`:
 ITF (Interleaved 2 of 5) barcode type
 - `PDF_417`:
 PDF417 barcode type
 - `QR_CODE`:
 QR Code barcode type
 - `MICRO_QR_CODE`:
 Micro QR Code barcode type
 - `DATABAR`:
 Databar barcode type
 - `DATABAR_EXPANDED`:
 Databar Expanded barcode type
 - `UPC_A`:
 UPC-A barcode type
 - `UPC_E`:
 UPC-E barcode type
 - `MSI_PLESSEY`:
 MSI Plessey barcode type
 - `IATA_2_OF_5`:
 IATA 2 of 5 barcode type
 - `INDUSTRIAL_2_OF_5`:
 Industrial 2 of 5 barcode type
 - `USPS_INTELLIGENT_MAIL`:
 USPS Intelligent Mail (aka USPS OneCode, USPS-STD-11)
 - `ROYAL_MAIL`:
 Royal Mail Four-State Customer Code, (aka RM4SCC, CBC, BPO 4 State Code)
 - `JAPAN_POST`:
 Japan Post Four-State Barcode
 - `ROYAL_TNT_POST`:
 Royal TNT Post Four-State Barcode (aka KIX, Klant IndeX)
 - `AUSTRALIA_POST`:
 Australia Post Four-State Customer Code
 - `DATABAR_LIMITED`:
 GS1 DataBar Limited
 - `GS1_COMPOSITE`:
 GS1 Composite
 - `MICRO_PDF_417`:
 Databar micro pdf 417
 */
export type BarcodeFormat = "AZTEC" | "CODABAR" | "CODE_25" | "CODE_39" | "CODE_93" | "CODE_128" | "DATA_MATRIX" | "EAN_8" | "EAN_13" | "ITF" | "PDF_417" | "QR_CODE" | "MICRO_QR_CODE" | "DATABAR" | "DATABAR_EXPANDED" | "UPC_A" | "UPC_E" | "MSI_PLESSEY" | "IATA_2_OF_5" | "INDUSTRIAL_2_OF_5" | "USPS_INTELLIGENT_MAIL" | "ROYAL_MAIL" | "JAPAN_POST" | "ROYAL_TNT_POST" | "AUSTRALIA_POST" | "DATABAR_LIMITED" | "GS1_COMPOSITE" | "MICRO_PDF_417";
/**
 Filter for extended EAN and UPC barcodes.

 - `NO_FILTER`:
 EAN and UPC codes are not filtered. Both are returned regardless if they have an extension or not.
 - `ONLY_WITH_EXTENSIONS`:
 Only EAN and UPC codes with extensions are returned.
 - `ONLY_WITHOUT_EXTENSIONS`:
 Only EAN and UPC codes without extensions are returned.
 */
export type BarcodesExtensionFilter = "NO_FILTER" | "ONLY_WITH_EXTENSIONS" | "ONLY_WITHOUT_EXTENSIONS";
/**
 The engine mode to use for barcode recognition.

 - `ML`:
 Main engine mode. Supports all barcodes types.
 - `ML_LOW_POWER`:
 A faster version of the main engine mode, for use with low-power devices and in the browser.
 */
export type BarcodeEngineMode = "ML" | "ML_LOW_POWER";
/**
 Configuration of the scanning behavior.
 */
export declare class BarcodeRecognizerConfiguration extends PartiallyConstructible {
    /**
     Regular expression filter for barcode text. If the barcode text does not match the regular expression, it will not be scanned. The default is an empty string (setting is turned off). This option overrides `barcodesExtensionFilter` option.
     @defaultValue "";
     */
    barcodesRegexFilter: string;
    /**
     List of accepted barcode symbologies.
     @defaultValue [];
     */
    barcodeFormats: BarcodeFormat[];
    /**
     The expected way of handling GS1_COMPOSITE barcodes.
     @defaultValue "PARSE";
     */
    gs1Handling: Gs1Handling;
    /**
     The engine mode to use for barcode recognition.
     @defaultValue "ML_LOW_POWER";
     */
    engineMode: BarcodeEngineMode;
    /**
     Maximum resolution of the image processed by the barcode recognizer. Smaller values mean faster processing but lower recognition quality. The value is limited by the resolution of the preview.
     @defaultValue 600;
     */
    maximumRecognizerResolution: number;
    /** @param source {@displayType `DeepPartial<BarcodeRecognizerConfiguration>`} */
    constructor(source?: DeepPartial<BarcodeRecognizerConfiguration>);
}
