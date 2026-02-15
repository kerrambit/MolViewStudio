import { BrowserWindow, ipcMain, WebFrameMain } from "electron";
import { getUiPath } from "./pathResolver.js";
import { isDev } from "./utils/util.js";
import { pathToFileURL } from "url";
import { logger } from "./utils/logger.js";

/**
 * Using IPC adapters for Electron side.
 */
export class Ipc {
    static Electron = class {
        static handle<Key extends keyof EventPayloadMapping>(
            key: Key,
            handler: () =>
                | Promise<EventPayloadMapping[Key]>
                | EventPayloadMapping[Key],
        ) {
            ipcMain.handle(key, (event) => {
                validateEventFrame(event.senderFrame);
                return handler();
            });
        }

        static handleSync<Key extends keyof EventPayloadMapping>(
            key: Key,
            handler: () => EventPayloadMapping[Key],
        ) {
            ipcMain.on(key, (event) => {
                validateEventFrame(event.senderFrame);
                event.returnValue = handler();
            });
        }

        // TODO: will be reworked
        static handleTwoWay<Key extends keyof EventPayloadMapping>(
            key: Key,
            handler: (
                payload: any,
            ) => Promise<EventPayloadMapping[Key]> | EventPayloadMapping[Key],
        ) {
            ipcMain.handle(key, (event, payload) => {
                validateEventFrame(event.senderFrame);
                return handler(payload);
            });
        }

        static send<Key extends keyof EventPayloadMapping>(
            key: Key,
            payload: EventPayloadMapping[Key],
            window: BrowserWindow,
        ) {
            window.webContents.send(key, payload);
        }

        static on<Key extends keyof EventPayloadMapping>(
            key: Key,
            callback: (payload: EventPayloadMapping[Key]) => void,
        ) {
            ipcMain.on(key, (event, payload) => {
                validateEventFrame(event.senderFrame);
                return callback(payload);
            });
        }
    };
}

/**
 * Simple validation method for checking if requests come from `dist-react/index.html` file (in production).
 * TODO: For more complex validation, new solution might be needed to develope.
 */
export function validateEventFrame(frame: WebFrameMain | null) {
    console.log(frame?.url);

    // Frame has either navigated or been destroyed.
    if (frame === null) {
        return;
    }
    if (isDev() && new URL(frame.url).host === "localhost:5123") {
        return;
    }
    if (frame.url !== pathToFileURL(getUiPath()).toString()) {
        logger.warn(
            `While validating event frame, malicious event may have occured!`,
        );
        throw new Error("Malicious Event Occured!");
    }
}
