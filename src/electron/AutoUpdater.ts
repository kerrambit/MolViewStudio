/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import pkg from "electron-updater";
const { autoUpdater } = pkg;
import { app, BrowserWindow, dialog } from "electron";
import { AppUpdater } from "electron-updater";
import { logger } from "./utils/logger.js";

// Disable automatic background downloading.
autoUpdater.autoDownload = false;

// TODO: temporary solution
autoUpdater.allowPrerelease = true;

export class AutoUpdater {
    private _appUpdater: AppUpdater = autoUpdater;
    private _isManualCheck: boolean = false;

    public constructor() {}

    public async checkForUpdates(isManualCheck: boolean) {
        this._isManualCheck = isManualCheck;
        return this._appUpdater?.checkForUpdates();
    }

    public registerHandlers(window?: BrowserWindow) {
        this._appUpdater.on("update-available", async (info) => {
            this._isManualCheck = false;

            logger.info("AutoUpdater: Update is available.");
            logger.info("Show dialogue <MolViewStudio Update Available>.");
            const { response } = await dialog.showMessageBox({
                type: "info",
                title: "MolViewStudio Update Available",
                message: `Version ${info.version} is available. Do you want to download it now?`,
                buttons: ["Yes", "No"],
                cancelId: 1,
            });

            if (response === 0) {
                logger.info("User clicked 'Yes' to download the update.");
                this._appUpdater.downloadUpdate();
            } else {
                logger.info("User clicked 'No' to not download the update.");
            }
        });

        this._appUpdater.on("update-downloaded", async () => {
            if (window) {
                window.setProgressBar(-1);
            }

            logger.info("AutoUpdater: Update is downloaded.");
            logger.info("Show dialogue <MolViewStudio Update Ready>.");
            const { response } = await dialog.showMessageBox({
                type: "info",
                title: "MolViewStudio Update Ready",
                message:
                    "The update has been downloaded. Do you want to restart and install it now?",
                buttons: ["Restart Now", "Later"],
                cancelId: 1,
            });

            if (response === 0) {
                logger.info(
                    "User clicked 'Restart Now' to restart the app and install update.",
                );
                this._appUpdater.quitAndInstall();
            } else {
                logger.info(
                    "User clicked 'Later' to not restart the app and install update now.",
                );
            }
        });

        this._appUpdater.on("checking-for-update", () => {
            logger.info("AutoUpdater: Checking for updates from GitHub.");
        });

        this._appUpdater.on("update-not-available", (info) => {
            logger.info(
                `AutoUpdater: Application is up to date. Latest remote version: <${
                    info.version
                }>, current app version: <${app.getVersion()}>.`,
            );

            if (this._isManualCheck) {
                logger.info("Show dialogue <MolViewStudio No Updates>.");
                dialog.showMessageBox({
                    type: "info",
                    title: "MolViewStudio No Updates",
                    message: `You are running the latest version (${app.getVersion()}).`,
                    buttons: ["OK"],
                });
            }
        });

        this._appUpdater.on("download-progress", (progressInfo) => {
            logger.info(
                `AutoUpdater: Downloading update: ${Math.round(
                    progressInfo.percent,
                )}% ` +
                    `(${Math.round(
                        progressInfo.transferred / 1024 / 1024,
                    )}MB / ` +
                    `${Math.round(progressInfo.total / 1024 / 1024)}MB)`,
            );

            if (window) {
                window.setProgressBar(progressInfo.percent / 100);
            }
        });

        this._appUpdater.on("error", (err) => {
            if (window) {
                window.setProgressBar(-1);
            }

            logger.error(
                `AutoUpdater: Error during check/download: <${
                    err?.message || err
                }>!`,
            );

            if (this._isManualCheck) {
                logger.info("Show dialogue <MolViewStudio Update Error>.");
                dialog.showErrorBox(
                    "MolViewStudio Update Error",
                    err?.message || "Unknown updater error",
                );
            }
        });
    }
}
