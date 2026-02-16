import { useQuery } from "@tanstack/react-query";
import { loggerUi } from "../utils/loggerUi";
import { getDomain } from "../../api/domain";
import { API } from "../../api/endpoints";

export function useServerStatus() {
    return useQuery({
        queryKey: ["serverStatus"],
        queryFn: async () => {
            const response = await fetch(getDomain() + API.health());

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
