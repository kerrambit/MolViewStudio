/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useCallback } from "react";
import { pickFileIndexByResolution } from "../../resolution/domain/pickFileByResolution";
import { useStartFileProcessing } from "../../../hooks/useStartFileProcessing";
import { getFilenameWithoutExtension } from "../../../../utils/fileDataUtils";
import { useProcessingSettings } from "../../../settings/hooks/useProcessingSettings";
import { checkOffersProcessing } from "../../../assets/domain/assetsDefinitions";
import { loggerUi } from "../../../../services/UiLoggingService";

export function useStartPreviewFileProcessing() {
    // Use processing settings.
    const { getPerFormatProcessingSettings } = useProcessingSettings();

    // Use file processing.
    const { startFileProcessing } = useStartFileProcessing();

    const startPreviewFileProcessing = useCallback(
        async (
            file: FileData,
            assetType: "Volume" | "Segmentation",
            asset: ManagedAsset,
            relativePath: string,
        ) => {
            if (!checkOffersProcessing(file.extension)) {
                loggerUi.warn(
                    `File preview processing for file <${file.name}> is not possible, as the format does not support processing.`,
                );
                return;
            }

            // Per-format settings of the preview processing.
            const previewSettings = getPerFormatProcessingSettings(
                file.extension,
            ).previewProcessing;

            await startFileProcessing(
                file,
                assetType,
                {
                    downsampling_strategy: previewSettings.downsamplingStrategy,
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

                    const smallestIndex = pickFileIndexByResolution(
                        outputFiles,
                        previewSettings.resolution,
                    );

                    // Name the preview same as the original file, with a "(Preview quality N)" suffix. N is incremented for each existing preview of the same original.
                    const previewQualityIndex = asset.children.length + 1;
                    const originalNameWithoutExtension =
                        getFilenameWithoutExtension(outputFiles[smallestIndex].name) ??
                        outputFiles[smallestIndex].name;
                    const previewName = `${originalNameWithoutExtension} (Preview quality ${previewQualityIndex}).mrc`;

                    return [
                        {
                            assetIndex: smallestIndex,
                            relativePath: relativePath,
                            name: previewName,
                            hidden: true,
                            kind: "Preview",
                            notify: false,
                        },
                    ];
                },
            );
        },
        [getPerFormatProcessingSettings, startFileProcessing],
    );

    return { startPreviewFileProcessing };
}
