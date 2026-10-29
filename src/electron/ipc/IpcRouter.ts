/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { app, BrowserWindow, dialog, shell } from "electron";
import path from "path";
import os from "os";
import fs from "fs";
import { saveUserSettings } from "../services/localUserSettingsStorage.js";
import { isDev } from "../utils/devUtils.js";
import { Ipc } from "../Ipc.Electron.js";
import { logger } from "../utils/logger.js";
import { readFiles, saveFile } from "../services/fileStorageService.js";
import {
    loadFileMappings,
    removeFileMapping,
    resolveAndStoreFileMapping,
    storeFileMappingFromData,
} from "../services/fileMappingsStorage.js";
import { BUILD_INFO } from "../build-info.js";
import { loadRecentFiles, writeRecentFiles } from "../services/recentFilesStorage.js";
import { AutoUpdater } from "../AutoUpdater.js";

// TODO: devide the indivudal handlers to more grouped folders such as "ipc/file" etc.
export function registerAllIpcHandlers(
    mainWindow: BrowserWindow,
    updater: AutoUpdater,
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

    // A request from UI to check if filepaths exist.
    Ipc.Electron.handle("checkFilesExist", (paths: string[]) => {
        const result: boolean[] = [];
        paths.forEach((path) => {
            result.push(fs.existsSync(path));
        });
        return result;
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
            const fullFilePath = path.join(app.getPath("userData"), relativePath);
            return await saveFile(fullFilePath, data);
        },
    );

    // A request from UI to resolve a local file path for a managed asset and store the mapping.
    Ipc.Electron.handle(
        "resolveAndStoreFileMapping",
        async (assetId: AssetId, originalFilePath: string) => {
            return await resolveAndStoreFileMapping(
                app.getPath("userData"),
                assetId,
                originalFilePath,
            );
        },
    );

    // A request from UI to store data of a managed asset (e.g. extracted from an MVSX archive) and add the mapping.
    Ipc.Electron.handle(
        "storeFileMappingFromData",
        async (assetId: AssetId, data: ArrayBuffer, extension: string) => {
            return await storeFileMappingFromData(
                app.getPath("userData"),
                assetId,
                data,
                extension,
            );
        },
    );

    // A request from UI to read all managed asset ID -> file path mappings.
    Ipc.Electron.handle("getFileMappings", () => {
        try {
            return loadFileMappings(app.getPath("userData"));
        } catch (err) {
            return new Error(
                `Failed to load file mappings! Details: <${(err as Error).message}>.`,
            );
        }
    });

    // A request from UI to remove a single managed asset mapping.
    Ipc.Electron.handle("removeFileMapping", async (assetId: AssetId) => {
        return await removeFileMapping(app.getPath("userData"), assetId);
    });

    // If there is a change of settings coming from UI, we have to update menu, and store changes.
    Ipc.Electron.on("changeUserSettings", (settings: UserSettings) => {
        saveUserSettings(paths.userDataPath, paths.userSettingsFilePath, settings);
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

            if (openDialogResult.canceled || openDialogResult.filePaths.length === 0) {
                return [];
            }

            return readFiles(openDialogResult.filePaths);
        },
    );

    // UI request to open file explorer and let user select a directory.
    Ipc.Electron.handle("selectDirectory", async (defaultPath?: string) => {
        const openDialogResult = await dialog.showOpenDialog({
            properties: ["openDirectory", "createDirectory"],
            defaultPath: defaultPath,
        });

        if (openDialogResult.canceled || openDialogResult.filePaths.length === 0) {
            return null;
        }

        return openDialogResult.filePaths[0];
    });

    // UI can request recent files paths.
    Ipc.Electron.handleSync("getRecentFiles", () => {
        const files = loadRecentFiles(paths.userDataPath, paths.recentFilesFilePath);
        logger.info(`Recent files has been loaded from <${paths.recentFilesFilePath}>.`);
        return files;
    });

    // If there is a new opened file coming from UI, we have to store the path.
    Ipc.Electron.on("addRecentFile", (path: string) => {
        const currentFiles = loadRecentFiles(
            paths.userDataPath,
            paths.recentFilesFilePath,
        );
        const updatedFiles = [path, ...currentFiles.filter((p) => p !== path)].slice(
            0,
            10,
        ); // TODO: set the limit in Settings

        writeRecentFiles(paths.userDataPath, paths.recentFilesFilePath, updatedFiles);
    });

    Ipc.Electron.handle("checkForUpdates", async () => {
        logger.info("Manual update check triggered from UI.");
        try {
            const result = await updater.checkForUpdates(true);
            if (result && result.updateInfo) {
                return {
                    version: result.updateInfo.version,
                    releaseDate: result.updateInfo.releaseDate,
                };
            }
            return null;
        } catch (error) {
            logger.error(`Manual update check failed: <${error}>!`);
            return null;
        }
    });
}
