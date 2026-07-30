import { useEffect } from "react";
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket";

import { z } from "zod";
import { loggerUi } from "../../services/UiLoggingService";

const ProcessVolumeProgressMessageSchema = z.object({
    stage: z.string(),
    error: z.string().nullable().optional(),
    result: z.string().array().nullable().optional(),
});

type ProcessVolumeProgressMessage = z.infer<
    typeof ProcessVolumeProgressMessageSchema
>;

export function useProcessingSocket(
    websocketUrl: string | null,
    websocketEndpoint: string,
    onProgress: (stage: string) => void,
    onDone: (result: string[]) => void,
    onError: (error: string) => void,
) {
    const { lastJsonMessage, readyState } = useWebSocket(websocketUrl, {
        share: false,
        shouldReconnect: () => true,
    });

    useEffect(() => {
        if (lastJsonMessage === null) return;

        const parsed =
            ProcessVolumeProgressMessageSchema.safeParse(lastJsonMessage);

        if (!parsed.success) {
            loggerUi.websockets.parserError(
                websocketEndpoint,
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
    }, [lastJsonMessage, websocketEndpoint, onDone, onError, onProgress]);

    return { readyState };
}
