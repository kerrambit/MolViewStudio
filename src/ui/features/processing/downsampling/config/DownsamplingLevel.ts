/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import type { DownsamplingStrategy } from "../../../../config/processingDefinitions";

/**
 * Simple downsampling levels offered in the processing dialogue. The full list of strategies
 * remains available in the advanced options.
 */
export type DownsamplingLevel = "light" | "medium" | "strong";

/**
 * Maps a simple downsampling level to the underlying strategy.
 */
export const DOWNSAMPLING_LEVEL_TO_STRATEGY: Record<
    DownsamplingLevel,
    DownsamplingStrategy
> = {
    light: "nearest",
    medium: "tricubic",
    strong: "triquintic",
};

/**
 * Options of the simple downsampling levels.
 */
export function getDownsamplingLevelOptions(): DownsamplingLevel[] {
    return ["light", "medium", "strong"];
}
