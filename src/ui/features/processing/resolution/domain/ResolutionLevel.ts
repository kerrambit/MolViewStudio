/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

/**
 * Levels of the processed volume resolution.
 * The processing pipeline emits one file per downsampling resolution (`r1`, `r2`).
 * The chosen level maps to that index, clamped to the resolutions actually available for each asset.
 */
export type ResolutionLevel = "low" | "high";

export const RESOLUTION_LEVEL_TO_INDEX: Record<ResolutionLevel, number> = {
    high: 1,
    low: 2,
};
/**
 * Options of the resolution levels.
 */
export function getResolutionLevelOptions(): ResolutionLevel[] {
    return ["low", "high"];
}

/**
 * Retrieves highest possible resolution level.
 */
export function getHighestPossibleResolution(): ResolutionLevel {
    return "high";
}

/**
 * Retrieves lowest possible resolution level.
 */
export function getLowestPossibleResolution(): ResolutionLevel {
    return "low";
}
