/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useCallback } from "react";
import { pickFileIndexByResolution } from "../../resolution/domain/pickFileByResolution";
import { getHighestPossibleResolution } from "../../resolution/domain/ResolutionLevel";
import { getFilenameWithoutExtension } from "../../../../utils/fileDataUtils";
import { useProcessingSettings } from "../../../settings/hooks/useProcessingSettings";
import { checkRequiresProcessing } from "../../../assets/domain/assetsDefinitions";
import { loggerUi } from "../../../logger/services/UiLoggingService";
import { useStartFileProcessing } from "../../hooks/useStartFileProcessing";

export function useStartFileRequiredProcessing() {
    // Use processing settings.
    const { getPerFormatProcessingSettings } = useProcessingSettings();

    // Use processing.
    const { startFileProcessing } = useStartFileProcessing();

    const startFileRequiredProcessing = useCallback(
        async (
            file: FileData,
            type: "Volume" | "Segmentation",
            asset: ManagedAsset,
            relativePath: string,
        ) => {
            if (!checkRequiresProcessing(file.extension)) {
                loggerUi.warn(
                    `Processing for file <${file.name}> won't be run, as the format does not require processing.`,
                );
                return;
            }

            // Per-format settings of the preview processing.
            const requireSetting = getPerFormatProcessingSettings(
                file.extension,
            ).requireProcessing;

            await startFileProcessing(
                file,
                type === "Segmentation" ? "Segmentation" : "Volume",
                {
                    downsampling_strategy: requireSetting.downsamplingStrategy,
                    volume_serializer: "mrc",
                    segmentation_mask_serializer: "mrc",
                    segmentation_volume_serializer: "mrc",
                    segmentation_mesh_serializer: "mrc",
                    bundling_approach: "null",
                },
                "Asset",
                asset.id,
                (outputFiles: FileData[]) => {
                    if (!outputFiles || outputFiles.length === 0) {
                        return [];
                    }

                    const biggestIndex = pickFileIndexByResolution(
                        outputFiles,
                        getHighestPossibleResolution(),
                    );

                    const originalNameWithoutExtension =
                        getFilenameWithoutExtension(asset.name) ?? asset.name;
                    const name = `${originalNameWithoutExtension}.mrc`;

                    return [
                        {
                            assetIndex: biggestIndex,
                            relativePath: relativePath,
                            name: name,
                            hidden: false,
                            kind: "NecessaryConversion",
                            notify: true,
                        },
                    ];
                },
            );
        },
        [getPerFormatProcessingSettings, startFileProcessing],
    );

    return {
        /**
         * Function starts required processing of a file. Does not change regime.
         */
        startFileRequiredProcessing,
    };
}
