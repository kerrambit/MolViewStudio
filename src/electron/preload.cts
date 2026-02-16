/**
 * Definition of Mol* App (Electron) API. This way, UI can communicate with Electron.
 * See https://www.electronjs.org/docs/latest/tutorial/context-isolation.
 */

const electron = require("electron");

/**
 * Using IPC adapters for UI side.
 */
export class Ipc {
    static Ui = class {
        static invoke<Key extends keyof EventPayloadMapping>(
            key: Key,
        ): Promise<EventPayloadMapping[Key]> {
            return electron.ipcRenderer.invoke(key);
        }

        static invokeSync<Key extends keyof EventPayloadMapping>(
            key: Key,
        ): EventPayloadMapping[Key] {
            return electron.ipcRenderer.sendSync(key);
        }

        // TODO: will be reworked
        static invokeTwoWay<Key extends keyof EventPayloadMapping>(
            key: Key,
            payload: any,
        ): Promise<EventPayloadMapping[Key]> {
            return electron.ipcRenderer.invoke(key, payload);
        }

        static on<Key extends keyof EventPayloadMapping>(
            key: Key,
            callback: (payload: EventPayloadMapping[Key]) => void,
        ) {
            const _callback = (_: Electron.IpcRendererEvent, payload: any) =>
                callback(payload);
            electron.ipcRenderer.on(key, _callback);
            return () => electron.ipcRenderer.off(key, _callback);
        }

        static send<Key extends keyof EventPayloadMapping>(
            key: Key,
            payload: EventPayloadMapping[Key],
        ) {
            electron.ipcRenderer.send(key, payload);
        }
    };
}

/**
 * API for communication between UI and Electron.
 * These methods can be used in the UI (React) components.
 */
electron.contextBridge.exposeInMainWorld("electron", {
    subscribeData: (callback: (data: string) => void) => {
        return Ipc.Ui.on("data", (payload: string) => {
            callback(payload);
        });
    },

    requestUserSettings: () => Ipc.Ui.invoke("requestUserSettings"),

    requestApplicationExit: () => Ipc.Ui.invoke("requestApplicationExit"),

    requestToOpenDevTools: () => Ipc.Ui.invoke("requestToOpenDevTools"),

    requestEnvironment: () => Ipc.Ui.invokeSync("requestEnvironment"),

    openFileExplorer: (multiSelections: boolean, filters: FileFilter[]) =>
        Ipc.Ui.invokeTwoWay("openFileExplorer", {
            multiSelections,
            filters,
        } as any),

    // TODO: this IPC methods should be changed, now paths are not checked againts types.d.ts
    getFileData: (paths: string[]) => {
        return Ipc.Ui.invokeTwoWay("getFileData", paths as any);
    },

    saveData: (data: ArrayBuffer, path: string) => {
        return Ipc.Ui.invokeTwoWay("saveData", {
            data: data,
            path: path,
        } as any);
    },

    saveTemporaryData: (data: ArrayBuffer, path: string) => {
        return Ipc.Ui.invokeTwoWay("saveTemporaryData", {
            data: data,
            path: path,
        } as any);
    },

    changeUserSettings: (settings: UserSettings) => {
        return Ipc.Ui.send("changeUserSettings", settings);
    },
} satisfies Window["electron"]);
