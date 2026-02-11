import { useMutation } from "@tanstack/react-query";
import { loggerUi } from "../utils/loggerUi";

interface ProcessVolumeArgs {
    filepath: string;
    temporaryDirectory: string;
}

export function useProcessVolume() {
    return useMutation({
        mutationFn: async (args: ProcessVolumeArgs) => {
            const endpoint = "http://localhost:41050/process_volume";

            loggerUi.info("API Request: POST /process_volume");
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
                        `API Response: POST /process_volume - FAILED`,
                    );
                    loggerUi.error(`  - Status: ${response.status}`);
                    loggerUi.error(`  - Error: ${errorMessage}`);

                    const error = new Error(errorMessage);
                    (error as any).isServerError = true;
                    throw error;
                }

                loggerUi.info(`API Response: POST /process_volume - SUCCESS`);
                loggerUi.info(`  - Status: ${response.status}`);

                return response;
            } catch (error) {
                if (error instanceof Error && !(error as any).isServerError) {
                    loggerUi.error(
                        `API Request: POST /process_volume - NETWORK ERROR`,
                    );
                    loggerUi.error(`  - Error: ${error.message}`);
                }
                throw error;
            }
        },
    });
}
