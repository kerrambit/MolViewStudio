const electron = require("electron");

/**
 * Class represents IPC adapters for renderer process IPC communication.
 */
export class Ipc {
    static Ui = class {
        /**
         * Fires an asynchronous invocation to the main process and returns a typed Promise.
         */
        static invoke<Key extends keyof IpcApiChannelMap>(
            key: Key,
            ...args: IpcApiChannelMap[Key]["args"]
        ): Promise<IpcApiChannelMap[Key]["reply"]> {
            // Forward arguments sequence natively across the IPC boundary
            return electron.ipcRenderer.invoke(key, ...args);
        }

        /**
         * Fires a synchronous, blocking request to the main process.
         */
        static invokeSync<Key extends keyof IpcApiChannelMap>(
            key: Key,
        ): IpcApiChannelMap[Key]["reply"] {
            return electron.ipcRenderer.sendSync(key);
        }

        /**
         * Sends a fire-and-forget message up to the main process.
         */
        static send<Key extends keyof IpcApiChannelMap>(
            key: Key,
            ...args: IpcApiChannelMap[Key]["args"]
        ): void {
            electron.ipcRenderer.send(key, ...args);
        }

        /**
         * Sets up a listener to handle real-time notifications pushed down from Electron.
         */
        static on<Key extends keyof IpcApiChannelMap>(
            key: Key,
            callback: (...args: IpcApiChannelMap[Key]["args"]) => void,
        ): UnsubscribeFunction {
            const _callback = (_: Electron.IpcRendererEvent, ...args: any[]) =>
                callback(...(args as any));
            electron.ipcRenderer.on(key, _callback);
            return () => electron.ipcRenderer.off(key, _callback);
        }
    };
}

/**
 * API for communication between UI and Electron.
 * These methods can be used in the UI (React) components.
 */
electron.contextBridge.exposeInMainWorld("electron", {
    requestUserSettings: () => Ipc.Ui.invokeSync("requestUserSettings"),

    requestBuildInformation: () => Ipc.Ui.invokeSync("requestBuildInformation"),

    requestApplicationExit: () => Ipc.Ui.invoke("requestApplicationExit"),

    requestToOpenDevTools: () => Ipc.Ui.send("requestToOpenDevTools"),

    requestEnvironment: () => Ipc.Ui.invokeSync("requestEnvironment"),

    requestToOpenExternal: (url: string) => {
        return Ipc.Ui.send("requestToOpenExternal", url);
    },

    requestToOpenUserDataFolder: () =>
        Ipc.Ui.invoke("requestToOpenUserDataFolder"),

    openFileExplorer: (multiSelections: boolean, filters: FileFilter[]) =>
        Ipc.Ui.invoke("openFileExplorer", multiSelections, filters),

    getFileData: (paths: string[]) => {
        return Ipc.Ui.invoke("getFileData", paths as any);
    },

    saveData: (data: ArrayBuffer, path: string) => {
        return Ipc.Ui.invoke("saveData", data, path);
    },

    saveTemporaryData: (data: ArrayBuffer, path: string) => {
        return Ipc.Ui.invoke("saveTemporaryData", data, path);
    },

    changeUserSettings: (settings: UserSettings) => {
        return Ipc.Ui.send("changeUserSettings", settings);
    },

    getRecentFiles: () => {
        return Ipc.Ui.invokeSync("getRecentFiles");
    },

    addRecentFile: (path: string) => {
        return Ipc.Ui.send("addRecentFile", path);
    },
} satisfies Window["electron"]);
