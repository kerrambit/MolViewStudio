/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import type { DownsamplingStrategy } from "../../processing/downsampling/config/DownsamplingStrategy";
import type { ResolutionLevel } from "../../processing/resolution/domain/ResolutionLevel";

export type ProcessingSettings = {
    global: {
        onLoadProcessing: boolean;
        exportProcessing: {
            downsamplingStrategy: DownsamplingStrategy;
            resolution: ResolutionLevel;
        };
    };
    perFormat: {
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
    }[];
};
