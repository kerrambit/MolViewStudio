import { app, BrowserWindow, Menu, Tray } from "electron";
import { getAssetsPath } from "./pathResolver.js";
import path from 'path';

export function createTray(mainWindow: BrowserWindow) {

    const tray = new Tray(path.join(getAssetsPath(), process.platform === "darwin" ? "trayIconTemplate.png" : "trayIcon.png"));
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Electron', type: "header", enabled: false, click: ()=>{ app.quit(); } },
        { type: "separator" },
        { label: 'Show Electron', click: ()=>{
            mainWindow.show();
            if (app.dock) {
                app.dock.show();
            }
         } },
        { label: 'Check For Updates...', click: ()=>{  } },
        { type: "separator" },
        { label: 'Quit Electron', click: ()=>{ app.quit(); } },
    ])

    tray.setToolTip("Electron");
    tray.setContextMenu(contextMenu);
}