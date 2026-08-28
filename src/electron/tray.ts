/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { app, BrowserWindow, Menu, Tray } from "electron";
import { getAssetsPath } from "./utils/pathResolver.js";
import path from "path";

// TODO: use system language for this, default English
export function createTray(mainWindow: BrowserWindow) {
    const tray = new Tray(
        path.join(
            getAssetsPath(),
            process.platform === "darwin"
                ? "trayIconTemplate.png"
                : "trayIcon.png",
        ),
    );
    const contextMenu = Menu.buildFromTemplate([
        {
            label: "MolView Studio",
            type: "header",
            enabled: false,
            click: () => {
                app.quit();
            },
        },
        { type: "separator" },
        {
            label: "Show MolView Studio",
            click: () => {
                mainWindow.show();
                if (app.dock) {
                    app.dock.show();
                }
            },
        },
        { label: "Check For Updates...", click: () => {} },
        { type: "separator" },
        {
            label: "Quit MolView Studio",
            click: () => {
                app.quit();
            },
        },
    ]);

    tray.setToolTip("MolView Studio");
    tray.setContextMenu(contextMenu);
}
