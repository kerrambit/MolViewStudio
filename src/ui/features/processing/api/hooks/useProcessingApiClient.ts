/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useMemo } from "react";

import { useProcessingDomain } from "./useProcessingDomain";
import { webSocketEndpoints } from "../webSocketEndpoints";
import { createApiClient } from "../generated-schemas";

type WebSocketEndpoints = typeof webSocketEndpoints;

/**
 * Prefixes every web socket endpoint builder with the web socket base URL,
 * keeping the original parameters and names type-safe.
 */
function bindWebSocketEndpoints<T extends Record<string, (...args: any[]) => string>>(
    baseUrl: string,
    endpoints: T,
) {
    const bound = {} as { [K in keyof T]: (...args: Parameters<T[K]>) => string };
    for (const name of Object.keys(endpoints) as (keyof T)[]) {
        bound[name] = (...args) => baseUrl + endpoints[name](...args);
    }
    return bound;
}

export function useProcessingApiClient() {
    // Use domain.
    const domain = useProcessingDomain();

    // Memoized the API client, endpoints and methods for each endpoint.
    return useMemo(() => {
        const apiClient = createApiClient(domain.http);

        const endpoints = Object.fromEntries(
            apiClient.api.map((e) => [e.alias, e.path]),
        ) as Record<(typeof apiClient.api)[number]["alias"], string>;

        const methods = Object.fromEntries(
            apiClient.api.map((e) => [e.alias, e.method.toUpperCase()]),
        ) as Record<(typeof apiClient.api)[number]["alias"], string>;

        const webSocketsMethods = bindWebSocketEndpoints<WebSocketEndpoints>(
            domain.ws,
            webSocketEndpoints,
        );

        return { apiClient, endpoints, methods, webSocketEndpoints, webSocketsMethods };
    }, [domain]);
}
