/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useQuery } from "@tanstack/react-query";
import { handleApiResponseError } from "../../../../api/utils/handleApiResponseError";
import { useProcessingApiClient } from "../../api/hooks/useProcessingApiClient";

export function useProcessingServerHealth() {
    // Use API client.
    const { apiClient, endpoints, methods } = useProcessingApiClient();

    return useQuery({
        queryKey: ["health"],
        queryFn: async () => {
            try {
                await apiClient.health();
                return true;
            } catch (error) {
                handleApiResponseError(error, endpoints["health"], methods["health"]);

                throw error;
            }
        },
        retry: 3,
        retryDelay: 1000,
        refetchInterval: 2500,
    });
}
