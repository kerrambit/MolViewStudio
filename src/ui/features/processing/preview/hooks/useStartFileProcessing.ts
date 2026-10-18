/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useCallback } from "react";
import { useEnvironment } from "../../../../hooks/useEnvironment";
import { pushErrorNotification } from "../../../../services/NotificationService";
import { loggerUi } from "../../../../services/UiLoggingService";
import { useManagedAssetsStore } from "../../../../stores/managedAssetsStore";
import type { ProcessingJobPurpose } from "../../domain/ProcessingJob";
import { useProcessingStore } from "../../stores/processingStore";
import type { ProcessVolumeRequestWithoutFilepaths } from "../../volume/api/ProcessVolumeRequest";
import { useProcessVolume } from "../../volume/api/useProcessVolume";

export function useStartFileProcessing() {
    // Use environment.
    const env = useEnvironment();

    // Use processing.
    const processVolume = useProcessVolume();

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
            const temporaryDirectory = `${env.userDataPath}/Processing`;

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
        [env.userDataPath, processVolume],
    );

    return {
        /**
         * Function starts processing of a file. Does not change regime.
         */
        startFileProcessing,
    };
}
