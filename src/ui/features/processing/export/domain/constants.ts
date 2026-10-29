/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import type { DownsamplingStrategy } from "../../downsampling/config/DownsamplingStrategy";
import type { ResolutionLevel } from "../../resolution/domain/ResolutionLevel";

export const DEFAULT_EXPORT_DOWNSAMPLING_STRATEGY: DownsamplingStrategy = "nearest"; // TODO: until volsegtools crashed on non-nearest strategy, otherwise tricubic

export const DEFAULT_EXPORT_RESOLUTION_LEVEL: ResolutionLevel = "high";
