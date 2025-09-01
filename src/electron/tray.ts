import { app, BrowserWindow, Menu, Tray } from "electron";
import { getAssetsPath } from "./pathResolver.js";
import path from "path";

// TODO: use system language for this, default English
export function createTray(mainWindow: BrowserWindow) {
    const tray = new Tray(
        path.join(
            getAssetsPath(),
            process.platform === "darwin"
                ? "trayIconTemplate.png"
                : "trayIcon.png"
        )
    );
    const contextMenu = Menu.buildFromTemplate([
        {
            label: "Mol* App",
            type: "header",
            enabled: false,
            click: () => {
                app.quit();
            },
        },
        { type: "separator" },
        {
            label: "Show Mol* App",
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
            label: "Quit Mol* App",
            click: () => {
                app.quit();
            },
        },
    ]);

    tray.setToolTip("Mol* App");
    tray.setContextMenu(contextMenu);
}
