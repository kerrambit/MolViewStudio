import { useMutation } from "@tanstack/react-query";

export function useProcessVolume() {
    return useMutation({
        mutationFn: async (filepath: string) => {
            const response = await fetch(
                "http://localhost:41050/process_volume", // TODO: these urls must be kept in more structured and logical way
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ filepath }),
                }
            );

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }

            return response;
        },
    });
}
