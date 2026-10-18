/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useCallback } from "react";
import { useEnvironment } from "../../../../hooks/useEnvironment";
import { pushErrorNotification } from "../../../../services/NotificationService";
import { loggerUi } from "../../../../services/UiLoggingService";
import type { ProcessVolumeRequestWithoutFilepaths } from "../../volume/api/ProcessVolumeRequest";
import { useProcessVolume } from "../../volume/api/useProcessVolume";
``;
export function useStartFileProcessingForExport() {
    // Use environment.
    const env = useEnvironment();

    // Use processing.
    const processVolume = useProcessVolume();

    const startExportProcessing = useCallback(
        async (
            filePath: string,
            isSegmentation: boolean,
            properties: ProcessVolumeRequestWithoutFilepaths,
        ): Promise<string | Error> => {
            const temporaryDirectory = `${env.userDataPath}/Processing`;

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
        [env.userDataPath, processVolume],
    );

    return {
        /**
         * Starts a single export processing job for one file and resolves with the job ID.
         * Does not change regime.
         */
        startExportProcessing,
    };
}
