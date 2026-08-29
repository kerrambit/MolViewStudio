/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useMutation } from "@tanstack/react-query";
import { loggerUi } from "../../services/UiLoggingService";
import { useApiClient } from "./useApiClient";
import { handleApiResponseError } from "../utils/handleApiResponseError";
import type { ProcessVolumeRequest } from "../../config/processingDefinitions";

export function useProcessVolume() {
    // Use API client.
    const { apiClient, endpoints, methods } = useApiClient();

    return useMutation({
        mutationFn: async (args: ProcessVolumeRequest) => {
            const endpoint = endpoints["processVolume"];
            const method = methods["processVolume"];

            loggerUi.api.request(endpoint, method, args);

            try {
                const result = await apiClient.processVolume(args);
                loggerUi.api.successResponse(endpoint, method);
                return result;
            } catch (error) {
                handleApiResponseError(error, endpoint, method);
                throw error;
            }
        },
    });
}
