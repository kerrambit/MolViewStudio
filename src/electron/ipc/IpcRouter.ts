import { app, BrowserWindow, dialog, Menu, shell } from "electron";
import path from "path";
import os from "os";
import { saveUserSettings } from "../utils/localUserSettingsUtils.js";
import { isDev } from "../utils/devUtils.js";
import { Ipc } from "../Ipc.Electron.js";
import { logger } from "../utils/logger.js";
import { readFiles, saveFile } from "../utils/fileUtils.js";
import { BUILD_INFO } from "../build-info.js";
import {
    loadRecentFiles,
    writeRecentFiles,
} from "../utils/recentFilesUtils.js";

// TODO: devide the indivudal handlers to more grouped folders such as "ipc/file" etc.
export function registerAllIpcHandlers(
    mainWindow: BrowserWindow,
    userSettings: UserSettings,
    serverPort: number,
    paths: {
        userDataPath: string;
        userSettingsFilePath: string;
        recentFilesFilePath: string;
    },
) {
    // A requests from UI to retrieve user settings.
    Ipc.Electron.handleSync("requestUserSettings", () => {
        return { ...userSettings, serverPort: serverPort };
    });

    // A requests from UI to retrieve build information.
    Ipc.Electron.handleSync("requestBuildInformation", (): BuildInformation => {
        return {
            app: app.getName(),
            appVersion: app.getVersion(),
            commit: BUILD_INFO.commit,
            buildDate: BUILD_INFO.buildDate,
            electron: process.versions.electron,
            chrome: process.versions.chrome,
            node: process.versions.node,
            platform: process.platform,
            arch: process.arch,
            osRelease: os.release(),
            molstarVersion: BUILD_INFO.molstarVersion,
            volsegtoolsVersion: BUILD_INFO.volsegtoolsVersion,
        };
    });

    // A request from UI to quit the application, exit procedure is executed.
    Ipc.Electron.handle("requestApplicationExit", () => {
        app.quit();
    });

    // A request from UI to open DevTools: if the application is in dev mode, allow it.
    Ipc.Electron.on("requestToOpenDevTools", () => {
        if (isDev()) {
            mainWindow.webContents.openDevTools();
        }
    });

    // A request from UI to open external URL.
    Ipc.Electron.on("requestToOpenExternal", (url: string) => {
        shell.openExternal(url);
        logger.info(`External URL <${url}> was requested to be opened.`);
    });

    // A requests from UI to open user data folder.
    Ipc.Electron.handle("requestToOpenUserDataFolder", async () => {
        const errorMessage = await shell.openPath(app.getPath("userData"));

        if (errorMessage) {
            logger.error(`Failed to open folder: <${errorMessage}>!`);
            return new Error(errorMessage);
        }
        return;
    });

    // A request from UI to load file data from given array of paths.
    Ipc.Electron.handle("getFileData", (paths: string[]) => {
        return readFiles(paths);
    });

    // A request from UI to save data into filesystem.
    Ipc.Electron.handle("saveData", async (data: ArrayBuffer, path: string) => {
        return await saveFile(path, data);
    });

    // A request from UI to save temporary data into filesystem.
    Ipc.Electron.handle(
        "saveTemporaryData",
        async (data: ArrayBuffer, relativePath: string) => {
            const fullFilePath = path.join(
                app.getPath("userData"),
                relativePath,
            );
            return await saveFile(fullFilePath, data);
        },
    );

    // If there is a change of settings coming from UI, we have to update menu, and store changes.
    Ipc.Electron.on("changeUserSettings", (settings: UserSettings) => {
        saveUserSettings(
            paths.userDataPath,
            paths.userSettingsFilePath,
            settings,
        );
        logger.info(`User settings has been saved.`);
    });

    // UI can request environmanet information.
    Ipc.Electron.handleSync("requestEnvironment", () => {
        return { isDev: isDev(), userDataPath: app.getPath("userData") };
    });

    // UI request to open file explorer and get the chosen file data.
    Ipc.Electron.handle(
        "openFileExplorer",
        async (multiSelections: boolean, filters: FileFilter[]) => {
            const openDialogResult = await dialog.showOpenDialog({
                properties: multiSelections
                    ? ["openFile", "multiSelections"]
                    : ["openFile"],
                filters: filters,
            });

            if (
                openDialogResult.canceled ||
                openDialogResult.filePaths.length === 0
            ) {
                return [];
            }

            return readFiles(openDialogResult.filePaths);
        },
    );

    // UI can request recent files paths.
    Ipc.Electron.handleSync("getRecentFiles", () => {
        const files = loadRecentFiles(
            paths.userDataPath,
            paths.recentFilesFilePath,
        );
        logger.info(
            `Recent files has been loaded from <${paths.recentFilesFilePath}>.`,
        );
        return files;
    });

    // If there is a new opened file coming from UI, we have to store the path.
    Ipc.Electron.on("addRecentFile", (path: string) => {
        const currentFiles = loadRecentFiles(
            paths.userDataPath,
            paths.recentFilesFilePath,
        );
        const updatedFiles = [
            path,
            ...currentFiles.filter((p) => p !== path),
        ].slice(0, 10); // TODO: set the limit in Settings

        writeRecentFiles(
            paths.userDataPath,
            paths.recentFilesFilePath,
            updatedFiles,
        );
    });
}
