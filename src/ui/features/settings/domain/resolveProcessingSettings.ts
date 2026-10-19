/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { getAssetConfig } from "../../assets/domain/assetsDefinitions";
import type { DownsamplingStrategy } from "../../processing/downsampling/config/DownsamplingStrategy";
import { parseDownsamplingStrategy } from "../../processing/downsampling/config/parseDownsamplingStrategy";
import { parseResolutionLevel } from "../../processing/resolution/domain/parseResolutionLevel";
import type { ResolutionLevel } from "../../processing/resolution/domain/ResolutionLevel";
import { DEFAULT_REQUIRES_PROCESSING_DOWNSAMPLING_STRATEGY } from "../../processing/require/domain/constants";
import type { PerFormatProcessingSettingsEntry } from "./PerFormatProcessingSettingsEntry";
import type { ProcessingSettings } from "./ProcessingSettings";
import {
    DEFAULT_EXPORT_DOWNSAMPLING_STRATEGY,
    DEFAULT_EXPORT_RESOLUTION_LEVEL,
} from "../../processing/export/domain/constants";
import {
    DEFAULT_PREVIEW_DOWNSAMPLING_STRATEGY,
    DEFAULT_PREVIEW_RESOLUTION_LEVEL,
} from "../../processing/preview/domain/constants";

export function resolveProcessingSettings(
    settings?: UserSettings["processing"],
): ProcessingSettings {
    if (settings) {
        return {
            global: {
                exportProcessing: {
                    downsamplingStrategy: parseDownsamplingStrategy(
                        settings.global.exportProcessing.downsamplingStrategy,
                        DEFAULT_EXPORT_DOWNSAMPLING_STRATEGY,
                    ),
                    resolution: parseResolutionLevel(
                        settings.global.exportProcessing.resolution,
                        DEFAULT_EXPORT_RESOLUTION_LEVEL,
                    ),
                },
            },
            perFormat: (settings.perFormat || []).map((entry) => ({
                extension: entry.extension,
                requireProcessing: {
                    downsamplingStrategy: parseDownsamplingStrategy(
                        entry.requireProcessing.downsamplingStrategy,
                        DEFAULT_REQUIRES_PROCESSING_DOWNSAMPLING_STRATEGY,
                    ),
                },
                previewProcessing: {
                    downsamplingStrategy: parseDownsamplingStrategy(
                        entry.previewProcessing.downsamplingStrategy,
                        DEFAULT_PREVIEW_DOWNSAMPLING_STRATEGY,
                    ),
                    resolution: parseResolutionLevel(
                        entry.previewProcessing.resolution,
                        DEFAULT_PREVIEW_RESOLUTION_LEVEL,
                    ),
                },
                exportProcessing: {
                    downsamplingStrategy: parseDownsamplingStrategy(
                        entry.exportProcessing.downsamplingStrategy,
                        DEFAULT_EXPORT_DOWNSAMPLING_STRATEGY,
                    ),
                    resolution: parseResolutionLevel(
                        entry.exportProcessing.resolution,
                        DEFAULT_EXPORT_RESOLUTION_LEVEL,
                    ),
                },
            })),
        };
    }

    return {
        global: {
            exportProcessing: {
                downsamplingStrategy: DEFAULT_EXPORT_DOWNSAMPLING_STRATEGY,
                resolution: DEFAULT_EXPORT_RESOLUTION_LEVEL,
            },
        },
        perFormat: [],
    };
}

/**
 * Retrieves the stored per-format entry for the given extension, or the default
 * entry when the format has none stored yet.
 *
 * @param processing settings for processing
 * @param extension extension
 * @returns processing settings per format for `extension` asset
 */
export function getPerFormatEntry(
    processing: ProcessingSettings,
    extension: string,
    defaultRequiresProcessingDownsamplingStrategy: DownsamplingStrategy = DEFAULT_REQUIRES_PROCESSING_DOWNSAMPLING_STRATEGY,
    defaultPreviewDownsamplingStrategy: DownsamplingStrategy = DEFAULT_PREVIEW_DOWNSAMPLING_STRATEGY,
    defaultPreviewResolutionLevel: ResolutionLevel = DEFAULT_PREVIEW_RESOLUTION_LEVEL,
    defaultExportDownsamplingStrategy: DownsamplingStrategy = DEFAULT_EXPORT_DOWNSAMPLING_STRATEGY,
    defaultExportResolutionLevel: ResolutionLevel = DEFAULT_EXPORT_RESOLUTION_LEVEL,
): PerFormatProcessingSettingsEntry {
    // Try to find the user's saved entry first.
    if (processing.perFormat) {
        const existingEntry = processing.perFormat.find(
            (entry) => entry.extension === extension,
        );
        if (existingEntry) {
            return {
                extension: extension,
                requireProcessing: {
                    downsamplingStrategy: parseDownsamplingStrategy(
                        existingEntry.requireProcessing.downsamplingStrategy,
                        defaultRequiresProcessingDownsamplingStrategy,
                    ),
                },
                previewProcessing: {
                    downsamplingStrategy: parseDownsamplingStrategy(
                        existingEntry.previewProcessing.downsamplingStrategy,
                        defaultPreviewDownsamplingStrategy,
                    ),
                    resolution: parseResolutionLevel(
                        existingEntry.previewProcessing.resolution,
                        defaultPreviewResolutionLevel,
                    ),
                },
                exportProcessing: {
                    downsamplingStrategy: parseDownsamplingStrategy(
                        existingEntry.exportProcessing.downsamplingStrategy,
                        defaultExportDownsamplingStrategy,
                    ),
                    resolution: parseResolutionLevel(
                        existingEntry.exportProcessing.resolution,
                        defaultExportResolutionLevel,
                    ),
                },
            };
        }
    }

    // If not found, build a default entry from the asset configuration.
    const config = getAssetConfig(extension);
    if (config) {
        const requires = config.requiresProcessing;
        const offers = config.offersProcessing;

        return {
            extension: extension,
            requireProcessing: {
                downsamplingStrategy:
                    requires !== false
                        ? requires.downsamplingStrategy
                        : defaultRequiresProcessingDownsamplingStrategy,
            },
            previewProcessing: {
                downsamplingStrategy:
                    offers !== false
                        ? offers.previewProcessing.downsamplingStrategy
                        : defaultPreviewDownsamplingStrategy,
                resolution:
                    offers !== false
                        ? offers.previewProcessing.resolution
                        : defaultPreviewResolutionLevel,
            },
            exportProcessing: {
                downsamplingStrategy:
                    offers !== false
                        ? offers.exportProcessing.downsamplingStrategy
                        : defaultExportDownsamplingStrategy,
                resolution:
                    offers !== false
                        ? offers.exportProcessing.resolution
                        : defaultExportResolutionLevel,
            },
        };
    }

    // Absolute fallback if the extension is completely unknown.
    return {
        extension: extension,
        requireProcessing: {
            downsamplingStrategy: defaultRequiresProcessingDownsamplingStrategy,
        },
        previewProcessing: {
            downsamplingStrategy: defaultPreviewDownsamplingStrategy,
            resolution: defaultPreviewResolutionLevel,
        },
        exportProcessing: {
            downsamplingStrategy: defaultExportDownsamplingStrategy,
            resolution: defaultExportResolutionLevel,
        },
    };
}

/**
 * Resolves the export processing settings for the given extensions of the assets being processed.
 * When all assets share a single extension with per-format settings, those are used.
 * Otherwise (multiple extensions, or none) the global export processing settings are used,
 * because the export then processes all formats within a single processing call.
 *
 * Make sure all of extensions in `extensions` offer processing.
 *
 * @param processing processing part of the user settings
 * @param extensions extensions of all assets being processed, e.g. `["map", "map"]`
 * @returns the parsed, effective export processing settings
 */
export function resolveExportProcessingSettings(
    processing: ProcessingSettings,
    extensions: string[],
) {
    const uniqueExtensions = Array.from(new Set(extensions));
    const source =
        uniqueExtensions.length === 1
            ? getPerFormatEntry(processing, uniqueExtensions[0]).exportProcessing
            : {
                  downsamplingStrategy:
                      processing.global.exportProcessing.downsamplingStrategy,

                  resolution: processing.global.exportProcessing.resolution,
              };

    return {
        downsamplingMethod: source.downsamplingStrategy,
        resolution: source.resolution,
    };
}
