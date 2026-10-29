/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

/**
 * Endpoints for processing web sockets.
 * This file explicitly lists endpoints, as automatic API schema generation ignores web sockets.
 */
export const webSocketEndpoints = {
    process_volume: (jobId: string) => `/ws/process_volume/${jobId}`,
};
