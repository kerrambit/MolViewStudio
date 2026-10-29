/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useCallback } from "react";
import { pushErrorNotification } from "../../notifications/services/NotificationService";
import { loggerUi } from "../../logger/services/UiLoggingService";
import { useManagedAssetsStore } from "../../managed-assets/stores/managedAssetsStore";
import type { ProcessVolumeRequestWithoutFilepaths } from "../api/volume/ProcessVolumeRequest";
import { useProcessVolume } from "../api/volume/useProcessVolume";
import type { ProcessingJobPurpose } from "../domain/ProcessingJob";
import { useProcessingStore } from "../stores/processingStore";
import { useProcessingTemporaryDirectory } from "../temporary_directory/hooks/useProcessingTemporaryDirectory";

export function useStartFileProcessing() {
    // Use processing.
    const processVolume = useProcessVolume();
    const { getProcessingTemporaryDirectory } = useProcessingTemporaryDirectory();

    // TODO: code smell, we do not want to use directly api request, create facade object
    const startFileProcessing = useCallback(
        async (
            fileToProcess: FileData,
            type: "Volume" | "Segmentation",
            properties: ProcessVolumeRequestWithoutFilepaths,
            purpose: ProcessingJobPurpose,
            parentAssetId?: AssetId,
            chooseAssetsFunction?: (assets: FileData[]) => {
                assetIndex: number;
                relativePath: string;
                name: string;
                hidden: boolean;
                kind: ManagedAssetChildKind;
                notify: boolean;
            }[],
        ) => {
            const temporaryDirectory = getProcessingTemporaryDirectory();

            try {
                const result = await processVolume.mutateAsync({
                    ...properties,
                    temporary_directory: temporaryDirectory,
                    volume_filepaths: [fileToProcess.path],
                    segmentations_filepaths: [],
                });

                useProcessingStore
                    .getState()
                    .startJob(
                        fileToProcess,
                        result.job_id,
                        type,
                        purpose,
                        parentAssetId,
                        chooseAssetsFunction,
                    );

                if (parentAssetId) {
                    useManagedAssetsStore
                        .getState()
                        .attachProcessingJob(parentAssetId, result.job_id);
                }

                loggerUi.info(`Processing job <${result.job_id}> has started.`);
            } catch (err: any) {
                pushErrorNotification(
                    `Processing of file "${fileToProcess.name}" could not be started, because: "${err.message}"! You might need to restart the application and try processing once more.`,
                );
                loggerUi.error(
                    `Processing of file "${fileToProcess.path}" failed! See details: <${err.message}>.`,
                );
            }
        },
        [getProcessingTemporaryDirectory, processVolume],
    );

    return {
        /**
         * Function starts processing of a file. Does not change regime.
         */
        startFileProcessing,
    };
}
