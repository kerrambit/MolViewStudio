/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useMutation } from "@tanstack/react-query";
import { handleApiResponseError } from "../../../../api/utils/handleApiResponseError";
import { loggerUi } from "../../../logger/services/UiLoggingService";
import { useProcessingApiClient } from "../../api/hooks/useProcessingApiClient";
import { useProcessingTemporaryDirectory } from "../hooks/useProcessingTemporaryDirectory";
import type z from "zod";
import type { schemas } from "../../api/generated-schemas";

type CleanupRequest = z.infer<typeof schemas.CleanupRequest>;

export function useClearTemporaryDirectory() {
    // Use API client.
    const { apiClient, endpoints, methods } = useProcessingApiClient();

    // Use processing.
    const { getProcessingTemporaryDirectory } = useProcessingTemporaryDirectory();

    return useMutation({
        mutationFn: async () => {
            const endpoint = endpoints["cleanup"];
            const method = methods["cleanup"];

            const args: CleanupRequest = {
                path: getProcessingTemporaryDirectory(),
                remove_directory: false,
                dry_run: false,
            };

            loggerUi.api.request(endpoint, method, args);

            try {
                const result = await apiClient.cleanup(args);
                loggerUi.api.successResponse(endpoint, method);
                return result;
            } catch (error) {
                handleApiResponseError(error, endpoint, method);
                throw error;
            }
        },
        retry: (failureCount, error) => {
            const status = (error as { response?: { status?: number } })?.response
                ?.status;
            if (status !== undefined && status < 500) return false;
            return failureCount < 5;
        },
        retryDelay: (attempt) => Math.min(1000 * (attempt + 1), 5000),
    });
}
