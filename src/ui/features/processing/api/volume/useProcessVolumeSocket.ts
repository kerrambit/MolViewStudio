/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useEffect } from "react";
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket";
import { z } from "zod";
import { useProcessingApiClient } from "../hooks/useProcessingApiClient";
import { loggerUi } from "../../../../services/UiLoggingService";

const ProcessVolumeProgressMessageSchema = z.object({
    stage: z.string(),
    error: z.string().nullable().optional(),
    result: z.string().array().nullable().optional(),
});

type ProcessVolumeProgressMessage = z.infer<typeof ProcessVolumeProgressMessageSchema>;

export function useProcessVolumeSocket(
    jobId: string,
    onProgress: (stage: string) => void,
    onDone: (result: string[]) => void,
    onError: (error: string) => void,
) {
    const { webSocketsMethods, webSocketEndpoints } = useProcessingApiClient();

    const { lastJsonMessage, readyState } = useWebSocket(
        webSocketsMethods.process_volume(jobId),
        {
            share: false,
            shouldReconnect: () => true,
        },
    );

    useEffect(() => {
        if (lastJsonMessage === null) return;

        const parsed = ProcessVolumeProgressMessageSchema.safeParse(lastJsonMessage);

        if (!parsed.success) {
            loggerUi.websockets.parserError(
                webSocketEndpoints.process_volume(jobId),
                parsed.error.message,
            );
            return;
        }

        const message: ProcessVolumeProgressMessage = parsed.data;

        if (message.stage === "done") {
            if (message.error) {
                onError(message.error);
            } else {
                onDone(message.result ?? []);
            }
            return;
        }

        onProgress(message.stage);
    }, [
        lastJsonMessage,
        webSocketEndpoints.process_volume(jobId),
        onDone,
        onError,
        onProgress,
    ]);

    return { readyState };
}
