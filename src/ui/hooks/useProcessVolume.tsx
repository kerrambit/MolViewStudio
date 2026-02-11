import { useMutation } from "@tanstack/react-query";

interface ProcessVolumeArgs {
    filepath: string;
    temporaryDirectory: string;
}

export function useProcessVolume() {
    return useMutation({
        mutationFn: async (args: ProcessVolumeArgs) => {
            const response = await fetch(
                "http://localhost:41050/process_volume", // TODO: these urls must be kept in more structured and logical way
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        filepath: args.filepath,
                        temporary_directory: args.temporaryDirectory,
                    }),
                },
            );

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage =
                    errorData?.detail?.error ||
                    errorData?.detail ||
                    `Server returned ${response.status}`;
                throw new Error(errorMessage);
            }

            return response;
        },
    });
}
