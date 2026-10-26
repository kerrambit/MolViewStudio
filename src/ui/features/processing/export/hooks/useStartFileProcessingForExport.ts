/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useCallback } from "react";
import { pushErrorNotification } from "../../../../services/NotificationService";
import { loggerUi } from "../../../../services/UiLoggingService";
import type { ProcessVolumeRequestWithoutFilepaths } from "../../api/volume/ProcessVolumeRequest";
import { useProcessVolume } from "../../api/volume/useProcessVolume";
import { useProcessingTemporaryDirectory } from "../../temporary_directory/hooks/useProcessingTemporaryDirectory";

``;
export function useStartFileProcessingForExport() {
    // Use processing.
    const processVolume = useProcessVolume();
    const { getProcessingTemporaryDirectory } = useProcessingTemporaryDirectory();

    // TODO: code smell, we do not want to use directly api request, create facade object
    const startExportProcessing = useCallback(
        async (
            filePath: string,
            isSegmentation: boolean,
            properties: ProcessVolumeRequestWithoutFilepaths,
        ): Promise<string | Error> => {
            const temporaryDirectory = getProcessingTemporaryDirectory();

            try {
                const result = await processVolume.mutateAsync({
                    ...properties,
                    temporary_directory: temporaryDirectory,
                    volume_filepaths: isSegmentation ? [] : [filePath],
                    segmentations_filepaths: isSegmentation ? [filePath] : [],
                });
                loggerUi.info(`Export processing job <${result.job_id}> has started.`);
                return result.job_id;
            } catch (err) {
                const error = err as Error;
                pushErrorNotification(
                    `Processing of file <${filePath}> could not be started, because: "${error.message}"! You might need to restart the application and try processing once more.`,
                );
                loggerUi.error(
                    `Processing of file <${filePath}> failed! See details: <${error.message}>.`,
                );
                return error;
            }
        },
        [getProcessingTemporaryDirectory, processVolume],
    );

    return {
        /**
         * Starts a single export processing job for one file and resolves with the job ID.
         * Does not change regime.
         */
        startExportProcessing,
    };
}
