/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useCallback } from "react";
import { useProcessVolumeSocket } from "../../volume/api/useProcessVolumeSocket";
import {
    pushErrorNotification,
    pushSuccessNotification,
    pushWarningNotification,
} from "../../../../services/NotificationService";
import { loggerUi } from "../../../../services/UiLoggingService";
import { useManagedAssetsStore } from "../../../../stores/managedAssetsStore";
import { useProcessingStore } from "../../stores/processingStore";
import { useFileMappingsStore } from "../../../../stores/fileMappingsStore";
import { handleExportJobFinished } from "../../../viewer/export/services/exportService";

type ProcessingJobSocketProps = {
    jobId: string;
};

// TODO: insted of baking the logic here for `onDone` handler (see `job.purpose` type), we should provide a hanlder when starting the processing
export function ProcessingJobSocket(props: ProcessingJobSocketProps) {
    // Use the web socket hook for volume processing.
    useProcessVolumeSocket(
        props.jobId,
        // On progres.
        useCallback(
            (stage: string) => {
                // If the job does not exist, finish the handler and log the error.
                const job = useProcessingStore.getState().jobs.get(props.jobId);
                if (!job) {
                    pushErrorNotification(
                        `Internal error occurred when trying to handle processing web socket with invalid ID: ${props.jobId}!`,
                    );
                    loggerUi.error(
                        `Internal error occurred when trying to handle processing web socket with invalid ID: ${props.jobId}!`,
                    );
                    return;
                }

                // Update the job stage.
                useProcessingStore.getState().updateJobStage(props.jobId, stage);
            },
            [props.jobId],
        ),
        // On done.
        useCallback(
            async (result: string[]) => {
                // If the job does not exist, finish the handler and log the error.
                const job = useProcessingStore.getState().jobs.get(props.jobId);
                if (!job) {
                    pushErrorNotification(
                        `Internal error occurred when trying to handle processing web socket with invalid ID: ${props.jobId}!`,
                    );
                    loggerUi.error(
                        `Internal error occurred when trying to handle processing web socket with invalid ID: ${props.jobId}!`,
                    );
                    return;
                }

                // Mark job as completed.
                useProcessingStore.getState().completeJob(props.jobId, result);

                // Export jobs continue the export flow instead of adding new managed assets.
                if (job.purpose === "Export") {
                    await handleExportJobFinished(props.jobId);
                    return;
                }

                // Read assets from processed volume file.
                const assets = await window.electron.getFileData(result);

                // In case of error when reading assets, log errors and finish.
                if (assets instanceof Error) {
                    pushErrorNotification(
                        `Application was not able to read processed assets for processed file ${job.file.name}! For more information, see the logs.`,
                    );
                    loggerUi.error(
                        `Unable to read these assets [${result}] from processed file ${job.file.path}! Details: <${assets.message}>.`,
                    );
                    return;
                }

                if (!assets) {
                    pushWarningNotification(
                        `Processing of asset ${job.file.name} did not return any files back!`,
                    );
                    return;
                }

                if (job.chooseAssetsFunction) {
                    const chosenAssets = job.chooseAssetsFunction(assets);

                    for (const {
                        assetIndex,
                        relativePath,
                        name,
                        hidden,
                        kind,
                        notify,
                    } of chosenAssets) {
                        const newAsset = useManagedAssetsStore
                            .getState()
                            .addLocalAsset(
                                { ...assets[assetIndex], name: name },
                                relativePath,
                                job.assetType,
                                hidden,
                            );

                        if (!newAsset) {
                            pushErrorNotification(
                                `Asset "${relativePath}${name}" already exists!`,
                            );
                        } else {
                            // Resolve and store the file mapping (ID -> path) for the newly created asset.
                            const resolvedPath = await useFileMappingsStore
                                .getState()
                                .resolveAndStoreMapping(
                                    newAsset.id,
                                    assets[assetIndex].path,
                                );
                            if (!resolvedPath) {
                                pushErrorNotification(
                                    `Failed to store file mapping for asset "${relativePath}${name}"! Export and further processing of this asset may not work.`,
                                );
                            }

                            if (job.parentAssetId) {
                                useManagedAssetsStore
                                    .getState()
                                    .attachChildAsset(
                                        job.parentAssetId,
                                        newAsset.id,
                                        kind,
                                    );
                                useManagedAssetsStore
                                    .getState()
                                    .detachProcessingJob(job.parentAssetId, job.jobId);
                            }

                            loggerUi.info(
                                `File "${job.file.path}" was successfully processed and new asset "${relativePath}${name}" added.`,
                            );
                            if (notify) {
                                pushSuccessNotification(
                                    `File "${job.file.name}" was successfully processed and new asset "${relativePath}${name}" added.`,
                                );
                            }
                        }
                    }
                } else {
                    for (const asset of assets) {
                        const newAsset = useManagedAssetsStore
                            .getState()
                            .addLocalAsset(asset, asset.name, job.assetType, false);

                        if (!newAsset) {
                            pushErrorNotification(
                                `Asset "${asset.name}" already exists!`,
                            );
                        } else {
                            // Resolve and store the file mapping (ID -> path) for the newly created asset.
                            const resolvedPath = await useFileMappingsStore
                                .getState()
                                .resolveAndStoreMapping(newAsset.id, asset.path);
                            if (!resolvedPath) {
                                pushErrorNotification(
                                    `Failed to store file mapping for asset "${asset.name}"! Export and further processing of this asset may not work.`,
                                );
                            }

                            if (job.parentAssetId) {
                                useManagedAssetsStore
                                    .getState()
                                    .attachChildAsset(
                                        job.parentAssetId,
                                        newAsset.id,
                                        "Other",
                                    );
                                useManagedAssetsStore
                                    .getState()
                                    .detachProcessingJob(job.parentAssetId, job.jobId);
                            }
                            loggerUi.info(
                                `File "${job.file.path}" was successfully processed and new asset "${asset.name}" added.`,
                            );
                            pushSuccessNotification(
                                `File "${job.file.name}" was successfully processed and new asset "${asset.name}" added.`,
                            );
                        }
                    }
                }
            },
            [props.jobId],
        ),
        // On error.
        useCallback(
            async (error: string) => {
                // If the job does not exist, finish the handler and log the error.
                const job = useProcessingStore.getState().jobs.get(props.jobId);
                if (!job) {
                    pushErrorNotification(
                        `Internal error occurred when trying to handle processing web socket with invalid ID: ${props.jobId}!`,
                    );
                    loggerUi.error(
                        `Internal error occurred when trying to handle processing web socket with invalid ID: ${props.jobId}!`,
                    );
                    return;
                }

                // Mark job as failed.
                useProcessingStore.getState().failJob(props.jobId, error);

                // Export jobs cancel the whole export on failure.
                if (job.purpose === "Export") {
                    await handleExportJobFinished(props.jobId, error);
                    return;
                }

                // Detach the failed job from the parent asset, if any, so it is not reported as still processing.
                if (job.parentAssetId) {
                    useManagedAssetsStore
                        .getState()
                        .detachProcessingJob(job.parentAssetId, props.jobId);
                }
            },
            [props.jobId],
        ),
    );

    // Component runs the hook, does not render anything.
    return null;
}
