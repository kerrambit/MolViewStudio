/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { app, BrowserWindow, Menu, Tray } from "electron";
import path from "path";
import { getAssetsPath } from "./utils/pathResolver.js";
import { AutoUpdater } from "./AutoUpdater.js";

// TODO: use system language for this, default English
export function createTray(mainWindow: BrowserWindow, updater: AutoUpdater) {
    const tray = new Tray(
        path.join(
            getAssetsPath(),
            process.platform === "darwin" ? "trayIconTemplate.png" : "trayIcon.png",
        ),
    );
    const contextMenu = Menu.buildFromTemplate([
        {
            label: "VolSegStudio",
            type: "header",
            enabled: false,
            click: () => {
                app.quit();
            },
        },
        { type: "separator" },
        {
            label: "Show VolSegStudio",
            click: () => {
                mainWindow.show();
                if (app.dock) {
                    app.dock.show();
                }
            },
        },
        {
            label: "Check For Updates...",
            click: () => {
                updater.checkForUpdates(true);
            },
        },
        { type: "separator" },
        {
            label: "Quit VolSegStudio",
            click: () => {
                app.quit();
            },
        },
    ]);

    tray.setToolTip("VolSegStudio");
    tray.setContextMenu(contextMenu);
}
