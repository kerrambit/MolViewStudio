import { BrowserWindow, ipcMain, WebFrameMain } from "electron";
import { getUiPath } from "./utils/pathResolver.js";
import { isDev } from "./utils/devUtils.js";
import { pathToFileURL } from "url";
import { logger } from "./utils/logger.js";

/**
 * Class represents IPC adapters for electron process IPC communication.
 */
export class Ipc {
    static Electron = class {
        /**
         * Asynchronously handles a UI request and automatically forwards the return payload.
         */
        static handle<Key extends keyof IpcApiChannelMap>(
            key: Key,
            handler: (
                ...args: IpcApiChannelMap[Key]["args"]
            ) =>
                | Promise<IpcApiChannelMap[Key]["reply"]>
                | IpcApiChannelMap[Key]["reply"],
        ) {
            ipcMain.handle(key, (event, ...args) => {
                validateEventFrame(event.senderFrame);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return handler(...(args as any));
            });
        }

        /**
         * Synchronously handles a request, blocking the UI thread until returned.
         */
        static handleSync<Key extends keyof IpcApiChannelMap>(
            key: Key,
            handler: () => IpcApiChannelMap[Key]["reply"],
        ) {
            ipcMain.on(key, (event) => {
                validateEventFrame(event.senderFrame);
                event.returnValue = handler();
            });
        }

        /**
         * Listens to a fire-and-forget one-way notification from the UI.
         */
        static on<Key extends keyof IpcApiChannelMap>(
            key: Key,
            callback: (...args: IpcApiChannelMap[Key]["args"]) => void,
        ) {
            ipcMain.on(key, (event, ...args) => {
                validateEventFrame(event.senderFrame);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                callback(...(args as any));
            });
        }

        /**
         * Pushes an unsolicited notification event from Electron down to a window container.
         */
        static send<Key extends keyof IpcApiChannelMap>(
            key: Key,
            window: BrowserWindow,
            ...args: IpcApiChannelMap[Key]["args"]
        ) {
            window.webContents.send(key, ...args);
        }
    };
}

/**
 * Simple validation method for checking if requests come from `dist-react/index.html` file (in production).
 */
export function validateEventFrame(frame: WebFrameMain | null) {
    // Frame has either navigated or been destroyed.
    if (frame === null) {
        return;
    }
    // We check in development event comes from the vite server.
    if (isDev() && new URL(frame.url).host === "localhost:5123") {
        return;
    }
    // Otherwise, we checek event comes from the renderer process.
    if (frame.url !== pathToFileURL(getUiPath()).toString()) {
        logger.error(
            `While validating event frame, malicious event may have occured!`,
        );
        throw new Error("Malicious event cccured!");
    }
}
