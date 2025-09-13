/**
 * ML_LOW_POWER: A faster version of the main engine mode, for use with low-power devices and in the browser. Default.
 *
 * ML: The main engine mode, for use with high-power devices.
 *
 * LEGACY: The legacy engine mode. Fast but less accurate.
 */
export type EngineMode = "ML" | "ML_LOW_POWER" | "LEGACY";
