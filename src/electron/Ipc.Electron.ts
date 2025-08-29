import { BrowserWindow, ipcMain, WebFrameMain } from "electron";
import { getUiPath } from "./pathResolver.js";
import { isDev } from "./utils/util.js";
import { pathToFileURL } from "url";

/**
 * Using IPC adapters for Electron side.
 */
export class Ipc {
    static Electron = class {
        static handle<Key extends keyof EventPayloadMapping>(
            key: Key,
            handler: () => EventPayloadMapping[Key]
        ) {
            ipcMain.handle(key, (event) => {
                validateEventFrame(event.senderFrame);
                return handler();
            });
        }

        static send<Key extends keyof EventPayloadMapping>(
            key: Key,
            payload: EventPayloadMapping[Key],
            window: BrowserWindow
        ) {
            window.webContents.send(key, payload);
        }

        static on<Key extends keyof EventPayloadMapping>(
            key: Key,
            callback: (payload: EventPayloadMapping[Key]) => void
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

    if (frame === null) {
        return; // Frame has either navigated or been destroyed.
    }
    if (isDev() && new URL(frame.url).host === "localhost:5123") {
        return;
    }
    if (frame.url !== pathToFileURL(getUiPath()).toString()) {
        throw new Error("Malicious Event Occured!");
    }
}
