import { useMemo } from "react";
import { createApiClient } from "../generated-schemas";
import { useDomain } from "./useDomain";

export function useApiClient() {
    // Use domain.
    const domain = useDomain();

    // Memoized the API client, endpoints and methods for each endpoint.
    return useMemo(() => {
        const apiClient = createApiClient(domain.http);

        const endpoints = Object.fromEntries(
            apiClient.api.map((e) => [e.alias, e.path]),
        ) as Record<(typeof apiClient.api)[number]["alias"], string>;

        const methods = Object.fromEntries(
            apiClient.api.map((e) => [e.alias, e.method.toUpperCase()]),
        ) as Record<(typeof apiClient.api)[number]["alias"], string>;

        return { apiClient, endpoints, methods };
    }, [domain]);
}
