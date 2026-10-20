/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useCallback } from "react";
import { useFileMappingsStore } from "../../../stores/fileMappingsStore";
import { useManagedAssetsStore } from "../../../stores/managedAssetsStore";
import { useStartFileProcessing } from "../../hooks/useStartFileProcessing";
import { useStartPreviewFileProcessing } from "../../processing/preview/hooks/useStartPreviewFileProcessing";
import { useStartFileRequiredProcessing } from "../../processing/require/hooks/useStartFileRequiredProcessing";
import type { AddLocalAssetDialogueReturnType } from "../components/AddLocalAssetDialogueContent";
import {
    pushErrorNotification,
    pushInfoNotification,
} from "../../../services/NotificationService";
import { loggerUi } from "../../../services/UiLoggingService";
import {
    getFilenameWithoutExtension,
    getFileSizeInBytes,
} from "../../../utils/fileDataUtils";
import {
    MINIMAL_FILE_SIZE_TO_PROCESS_IN_BYTES,
    MINIMAL_FILE_SIZE_TO_PROCESS_IN_BYTES_AS_STRING,
} from "../../processing/domain/constants";
import { PREVIEW_DOWNSAMPLING_SIZE_THRESHOLD } from "../../processing/preview/domain/constants";
import { useProcessingSettings } from "../../settings/hooks/useProcessingSettings";
import { pickFileIndexByResolution } from "../../processing/resolution/domain/pickFileByResolution";
import { useWindowsStore } from "../../viewer/stores/WindowsStore";

export function useAddLocalAssets() {
    // Use managed assets.
    const addLocalAsset = useManagedAssetsStore((state) => state.addLocalAsset);

    // Use file mappings.
    const resolveAndStoreMapping = useFileMappingsStore(
        (state) => state.resolveAndStoreMapping,
    );

    // Use processing.
    const { startFileProcessing } = useStartFileProcessing();
    const { startFileRequiredProcessing } = useStartFileRequiredProcessing();
    const { startPreviewFileProcessing } = useStartPreviewFileProcessing();

    // Use processing settings.
    const { getPerFormatProcessingSettings } = useProcessingSettings();

    // Opens a dialogue to add local assets and processes the chosen files.
    const handleAddLocalAssets = useCallback(
        async (result: AddLocalAssetDialogueReturnType) => {
            for (const { file, offersProcessing, requiresProcessing } of result.files) {
                // Add new managed asset.
                const newAsset = addLocalAsset(
                    file,
                    result.relativePath,
                    result.type,
                    requiresProcessing || result.onLoadProcessing,
                );

                if (!newAsset) {
                    pushErrorNotification(
                        `Asset "${result.relativePath}${file.name}" already exists!`,
                    );
                    continue;
                }

                // Resolve and store the file mapping for the newly created asset.
                const resolvedPath = await resolveAndStoreMapping(newAsset.id, file.path);
                if (!resolvedPath) {
                    pushErrorNotification(
                        `Failed to store file mapping for asset "${result.relativePath}${file.name}"! Export and further processing of this asset may not work.`,
                    );
                    loggerUi.error(
                        `Failed to store file mapping for asset "${result.relativePath}${file.name}"!`,
                    );
                }

                // Large volume assets which offer processing are automatically downsampled into a preview using the nearest algorithm.
                const contentSizeInBytes = getFileSizeInBytes(file);

                if (
                    contentSizeInBytes < MINIMAL_FILE_SIZE_TO_PROCESS_IN_BYTES &&
                    requiresProcessing
                ) {
                    pushInfoNotification(
                        `File "${file.name}" requires processing, but its size is too small (< ${MINIMAL_FILE_SIZE_TO_PROCESS_IN_BYTES_AS_STRING}) to use standart processing. Therefore, the file will be skipped.`,
                    );
                    continue;
                }

                const isProcessableType =
                    result.type === "Volume" || result.type === "Segmentation";

                const shouldProcess =
                    isProcessableType &&
                    ((offersProcessing &&
                        contentSizeInBytes > PREVIEW_DOWNSAMPLING_SIZE_THRESHOLD) ||
                        requiresProcessing ||
                        result.onLoadProcessing);

                if (!shouldProcess) {
                    continue;
                }

                // On load processing has biggest priority.
                if (result.onLoadProcessing) {
                    await startFileProcessing(
                        file,
                        result.type === "Segmentation" ? "Segmentation" : "Volume",
                        {
                            downsampling_strategy: getPerFormatProcessingSettings(
                                file.extension,
                            ).exportProcessing.downsamplingStrategy,
                            volume_serializer: "mrc",
                            segmentation_mask_serializer: "mrc",
                            segmentation_volume_serializer: "mrc",
                            segmentation_mesh_serializer: "mrc",
                            bundling_approach: "null",
                        },
                        "Asset",
                        newAsset.id,
                        (outputFiles: FileData[]) => {
                            if (!outputFiles || outputFiles.length === 0) {
                                return [];
                            }

                            const chosenIndex = pickFileIndexByResolution(
                                outputFiles,
                                getPerFormatProcessingSettings(file.extension)
                                    .exportProcessing.resolution,
                            );

                            const originalNameWithoutExtension =
                                getFilenameWithoutExtension(file.name) ?? file.name;
                            const name = `${originalNameWithoutExtension}.mrc`;

                            return [
                                {
                                    assetIndex: chosenIndex,
                                    relativePath: result.relativePath,
                                    name: name,
                                    hidden: false,
                                    kind: "NecessaryConversion",
                                    notify: true,
                                },
                            ];
                        },
                    );

                    useWindowsStore.getState().openWindow("processing-jobs");
                } else if (requiresProcessing) {
                    await startFileRequiredProcessing(
                        file,
                        result.type === "Segmentation" ? "Segmentation" : "Volume",
                        newAsset,
                        result.relativePath,
                    );
                } else {
                    await startPreviewFileProcessing(
                        file,
                        result.type === "Segmentation" ? "Segmentation" : "Volume",
                        newAsset,
                        result.relativePath,
                    );
                }
            }
        },
        [
            addLocalAsset,
            resolveAndStoreMapping,
            startFileProcessing,
            startFileRequiredProcessing,
            startPreviewFileProcessing,
            getPerFormatProcessingSettings,
        ],
    );

    return { handleAddLocalAssets };
}
