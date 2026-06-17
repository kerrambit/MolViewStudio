import { useQuery } from "@tanstack/react-query";
import { loggerUi } from "../services/UiLoggingService";
import { useDomain } from "../api/hooks/useDomain";
import { API } from "../api/endpoints";

export function useServerStatus() {
    const domain = useDomain();

    return useQuery({
        queryKey: ["serverStatus"],
        queryFn: async () => {
            const response = await fetch(domain + API.health());

            if (!response.ok) {
                loggerUi.error(
                    `When fetching <${API.health()}>, an error occured! Server returned: <${response.json}>.`,
                );
                throw new Error(`Server returned ${response.status}`);
            }

            return true;
        },
        retry: 3,
        retryDelay: 1000,
        refetchInterval: 2500,
    });
}
