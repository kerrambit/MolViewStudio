import { useCallback } from "react";
import { useDomain } from "../../../../api/hooks/useDomain";
import { useProcessingSocket } from "../../../../api/hooks/useProcessVolumeWebSocket";
import { webSocketEndpoints } from "../../../../api/webSocketEndpoints";
import {
    pushErrorNotification,
    pushSuccessNotification,
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
                        `Internal error occured when trying to handle processing web socket with invalid ID: ${props.jobId}!`,
                    );
                    loggerUi.error(
                        `Internal error occured when trying to handle processing web socket with invalid ID: ${props.jobId}!`,
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
                        `Internal error occured when trying to handle processing web socket with invalid ID: ${props.jobId}!`,
                    );
                    loggerUi.error(
                        `Internal error occured when trying to handle processing web socket with invalid ID: ${props.jobId}!`,
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

                // Adds local asset into asset manager.
                assets.map((asset) => {
                    const wasSuccessful = useManagedAssetsStore
                        .getState()
                        .addLocalAsset(asset, job.relativePath);

                    if (!wasSuccessful) {
                        pushErrorNotification(
                            `Asset "${job.relativePath}${asset.name}" already exists!`,
                        );
                    } else {
                        loggerUi.info(
                            `File "${job.file.path}" was successfully processed and new asset "${job.relativePath}${asset.name}" added.`,
                        );
                        pushSuccessNotification(
                            `File "${job.file.name}" was successfully processed and new asset "${job.relativePath}${asset.name}" added.`,
                        );
                    }
                });
            },
            [props.jobId],
        ),
        useCallback(
            (error: string) => {
                // If the job does not exist, finish the handler and log the error.
                const job = useProcessingStore.getState().jobs.get(props.jobId);
                if (!job) {
                    pushErrorNotification(
                        `Internal error occured when trying to handle processing web socket with invalid ID: ${props.jobId}!`,
                    );
                    loggerUi.error(
                        `Internal error occured when trying to handle processing web socket with invalid ID: ${props.jobId}!`,
                    );
                    return;
                }

                // Mark job as failed.
                useProcessingStore.getState().failJob(props.jobId, error);
            },
            [props.jobId],
        ),
    );

    // Component runs the hook, does not render anything.
    return null;
}
