/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "./useApiClient";
import { handleApiResponseError } from "../utils/handleApiResponseError";

export function useServerStatus() {
    // Use API client.
    const { apiClient, endpoints, methods } = useApiClient();

    return useQuery({
        queryKey: ["serverStatus"],
        queryFn: async () => {
            try {
                await apiClient.health();
                return true;
            } catch (error) {
                handleApiResponseError(
                    error,
                    endpoints["health"],
                    methods["health"],
                );

                throw error;
            }
        },
        retry: 3,
        retryDelay: 1000,
        refetchInterval: 2500,
    });
}
