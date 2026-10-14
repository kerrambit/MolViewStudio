/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useCallback } from "react";
import { useDomain } from "../../../../api/hooks/useDomain";
import { useProcessingSocket } from "../../../../api/hooks/useProcessVolumeWebSocket";
import { webSocketEndpoints } from "../../../../api/webSocketEndpoints";
import {
    pushErrorNotification,
    pushSuccessNotification,
    pushWarningNotification,
} from "../../../../services/NotificationService";
import { loggerUi } from "../../../../services/UiLoggingService";
import { useManagedAssetsStore } from "../../../../stores/managedAssetsStore";
import { useProcessingStore } from "../../../../stores/processingStore";

type ProcessingJobSocketProps = {
    jobId: string;
};

export function ProcessingJobSocket(props: ProcessingJobSocketProps) {
    // Use domain and choose correct websocket endpoint.
    const domain = useDomain().ws;
    const websocketEndpoint = webSocketEndpoints.process_volume(props.jobId);

    // Use the web socket hook for volume processing.
    useProcessingSocket(
        domain + websocketEndpoint,
        websocketEndpoint,
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
                useProcessingStore
                    .getState()
                    .updateJobStage(props.jobId, stage);
            },
            [props.jobId],
        ),
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

                    chosenAssets.forEach(
                        ({
                            assetIndex,
                            relativePath,
                            name,
                            hidden,
                            kind,
                            notify,
                        }) => {
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
                                        .detachProcessingJob(
                                            job.parentAssetId,
                                            job.jobId,
                                        );
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
                        },
                    );
                } else {
                    assets.forEach((asset) => {
                        const newAsset = useManagedAssetsStore
                            .getState()
                            .addLocalAsset(
                                asset,
                                asset.name,
                                job.assetType,
                                false,
                            );

                        if (!newAsset) {
                            pushErrorNotification(
                                `Asset "${asset.name}" already exists!`,
                            );
                        } else {
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
                                    .detachProcessingJob(
                                        job.parentAssetId,
                                        job.jobId,
                                    );
                            }
                            loggerUi.info(
                                `File "${job.file.path}" was successfully processed and new asset "$${asset.name}" added.`,
                            );
                            pushSuccessNotification(
                                `File "${job.file.name}" was successfully processed and new asset "$${asset.name}" added.`,
                            );
                        }
                    });
                }
            },
            [props.jobId],
        ),
        useCallback(
            (error: string) => {
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
