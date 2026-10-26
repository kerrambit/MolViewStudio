/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import type { DownsamplingStrategy } from "../../downsampling/config/DownsamplingStrategy";
import type { ResolutionLevel } from "../../resolution/domain/ResolutionLevel";

/**
 * Assets with content larger than this threshold (in bytes) are automatically downsampled into a preview using the nearest algorithm.
 */
export const PREVIEW_DOWNSAMPLING_SIZE_THRESHOLD = 50 * 1024 * 1024; // TODO: define in Settings

export const DEFAULT_PREVIEW_DOWNSAMPLING_STRATEGY: DownsamplingStrategy = "nearest";

export const DEFAULT_PREVIEW_RESOLUTION_LEVEL: ResolutionLevel = "low";
