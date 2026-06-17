import { useMutation } from "@tanstack/react-query";
import { loggerUi } from "../services/UiLoggingService";
import { useDomain } from "../../api/useDomain";
import { API } from "../../api/endpoints";

interface ProcessVolumeArgs {
    filepath: string;
    temporaryDirectory: string;
}

export function useProcessVolume() {
    const domain = useDomain();

    return useMutation({
        mutationFn: async (args: ProcessVolumeArgs) => {
            const endpoint = domain + API.processVolume();

            loggerUi.info(`API Request: POST ${API.processVolume()}`);
            loggerUi.info(`  - filepath: ${args.filepath}`);
            loggerUi.info(`  - temporaryDirectory: ${args.temporaryDirectory}`);

            try {
                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        filepath: args.filepath,
                        temporary_directory: args.temporaryDirectory,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    const errorMessage =
                        errorData?.detail?.error ||
                        errorData?.detail ||
                        `Server returned ${response.status}`;

                    loggerUi.error(
                        `API Response: POST ${API.processVolume()} - FAILED`,
                    );
                    loggerUi.error(`  - Status: ${response.status}`);
                    loggerUi.error(`  - Error: ${errorMessage}`);

                    const error = new Error(errorMessage);
                    (error as any).isServerError = true;
                    throw error;
                }

                loggerUi.info(
                    `API Response: POST ${API.processVolume()} - SUCCESS`,
                );
                loggerUi.info(`  - Status: ${response.status}`);

                return response;
            } catch (error) {
                if (error instanceof Error && !(error as any).isServerError) {
                    loggerUi.error(
                        `API Request: POST ${API.processVolume()} - NETWORK ERROR`,
                    );
                    loggerUi.error(`  - Error: ${error.message}`);
                }
                throw error;
            }
        },
    });
}
