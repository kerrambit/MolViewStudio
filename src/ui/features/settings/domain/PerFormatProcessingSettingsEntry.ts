/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import type { DownsamplingStrategy } from "../../processing/downsampling/domain/DownsamplingStrategy";
import type { ResolutionLevel } from "../../processing/resolution/domain/ResolutionLevel";

export type PerFormatProcessingSettingsEntry = {
    extension: string;
    requireProcessing: {
        downsamplingStrategy: DownsamplingStrategy;
    };
    previewProcessing: {
        downsamplingStrategy: DownsamplingStrategy;
        resolution: ResolutionLevel;
    };
    exportProcessing: {
        downsamplingStrategy: DownsamplingStrategy;
        resolution: ResolutionLevel;
    };
};
