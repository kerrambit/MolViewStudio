import { useQuery } from "@tanstack/react-query";

export function useServerStatus() {
    return useQuery({
        queryKey: ["serverStatus"],
        queryFn: async () => {
            const response = await fetch("http://localhost:41050/health"); // TODO: these urls must be kept in more structured and logical way

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }

            return true;
        },
        retry: 3,
        retryDelay: 1000,
        refetchInterval: 2500,
    });
}
