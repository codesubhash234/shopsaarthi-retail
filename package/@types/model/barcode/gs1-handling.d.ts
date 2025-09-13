/**
 *  GS1 message handling options. The GS1 standard defines a
 *  a key-value format for business-centric data
 *  that can be encoded into many 1D and 2D barcode types.
 *  https://ref.gs1.org/standards/genspecs/
 *
 *  GS1 messages have two representations or formats: a human-readable format and a
 *  machine-readable format. The human-readable format uses parentheses to wrap the keys in each
 *  pair. For example, the string "(01)012345678901(37)02(3922)00278" contains three AI keys:
 *  01, 37, and 3922. The corresponding values are 012345678901, 02, and 00278.
 *
 *  The machine-readable format uses the special ASCII \x1D character to terminate key-value
 *  pairs in the string in cases where the given key implies that the value is variable-length.
 *  The equivalent machine-readable string for the above example is
 *  "010123456789013702\x1D392200278".
 *  In the above example, the 01 AI key is fixed-length, so the \x1D character is not necessary.
 *  The 37 AI keys is variable-length, so the \x1D character is necessary after the value in the
 *  pair. The 3922 AI key is also variable-length, but it is the last pair in the message, so
 *  the \x1D character is not necessary at the end.
 *
 *  The character \x1D is UNPRINTABLE - this means that if you try to print or otherwise
 *  visualize a GS1 message containing the \x1D character, you may see a number of different
 *  results, depending on how the system handles unprintable characters. You may see a question
 *  mark, a box, an escape sequence, a space or nothing at all.
 *
 *  `NONE`:
 *  The (FNC1) character is simply stripped from the result in barcodes that implement this
 *  mode.
 *  Do not use. Will be removed in a future release.
 *
 *  `PARSE`:
 *  This is the default. GS1 messages are converted to the machine-readable format per
 *  the GS1 spec (the special FNC1 character is converted to ASCII \x1D).
 *  The implied 01 AI key is prepended to DataBar results.
 *  No validation is performed.
 *
 *  `VALIDATE`:
 *  Same as PARSE. Additionally, messages containing unknown AI keys are not returned.
 *
 *  `DECODE`:
 *  Same as VALIDATE, except that GS1 strings are converted to the human-readable format,
 *  instead
 *  (with parentheses used to wrap AI keys, e.g. "(01)123456789"). The \x1D character is
 *  never used in this representation.
 */
export type GS1Handling = "NONE" | "PARSE" | "VALIDATE" | "DECODE";
