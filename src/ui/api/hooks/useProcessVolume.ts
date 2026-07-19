import { useMutation } from "@tanstack/react-query";
import { loggerUi } from "../../services/UiLoggingService";
import { useApiClient } from "./useApiClient";
import { handleApiResponseError } from "../utils/handleApiResponseError";

interface ProcessVolumeArgs {
    filepath: string;
    temporaryDirectory: string;
}

export function useProcessVolume() {
    // Use API client.
    const { apiClient, endpoints, methods } = useApiClient();

    return useMutation({
        mutationFn: async (args: ProcessVolumeArgs) => {
            const endpoint = endpoints["processVolume"];
            const method = methods["processVolume"];

            loggerUi.api.request(endpoint, method, {
                filepath: args.filepath,
                temporaryDirectory: args.temporaryDirectory,
            });

            try {
                const result = await apiClient.processVolume({
                    filepath: args.filepath,
                    temporary_directory: args.temporaryDirectory,
                });

                loggerUi.api.successResponse(endpoint, method);

                return result.output_files;
            } catch (error) {
                handleApiResponseError(error, endpoint, method);
                throw error;
            }
        },
    });
}
