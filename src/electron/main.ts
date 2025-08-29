import { app, BrowserWindow } from "electron";
import { isDev } from "./utils/util.js";
import { getAssetsPath, getPreloadPath, getUiPath } from "./pathResolver.js";
import { pollData } from "./logicMocker.js";
import { Ipc } from "./Ipc.Electron.js";
import { createTray } from "./tray.js";
import { createMenu } from "./menu.js";
import path from "path";
import {
    loadUserSettings,
    saveUserSettings,
} from "./utils/localUserSettingsUtils.js";

app.on("ready", () => {
    // Create main window with preload script. Main window is hidden so splash window can be shown first.
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        show: false,
        webPreferences: {
            preload: getPreloadPath(),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: true,
        },
    });

    // For development, use Vite Hot Reload Server on port 5123, see vite.config.ts.
    if (isDev()) {
        mainWindow.loadURL("http://localhost:5123/");
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(getUiPath());
    }

    // Create splash window.
    const splash = new BrowserWindow({
        width: 450,
        height: 300,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
    });

    splash.loadFile(path.join(getAssetsPath(), "splash.jpg"));
    splash.center();

    // ------------------------------------------------------------- //

    // Electron can send information in certain interval to UI component.
    pollData(mainWindow);

    // Create user data path and filepah.
    const userDataPath = app.getPath("userData");
    const userSettingsFile = path.join(userDataPath, "userSettings.json");

    // Load the settings.
    const userSettings: UserSettings = loadUserSettings(
        userDataPath,
        userSettingsFile
    );

    // If UI requests user settings, send it.
    Ipc.Electron.handle("requestUserSettings", () => {
        return userSettings;
    });

    // If there is a change of settings coming from UI, we have to update menu, and store changes.
    Ipc.Electron.on("changeUserSettings", (settings: UserSettings) => {
        saveUserSettings(userDataPath, userSettingsFile, settings);
        createMenu(mainWindow, settings.lang); // We have to recreate the menu to update the language.
    });

    // Create tray and menu.
    createTray(mainWindow);
    createMenu(mainWindow, userSettings.lang);

    // Handle close events.
    handleCloseEvents(mainWindow);

    // Once main window is ready, we close splash window and show the main window.
    mainWindow.once("ready-to-show", () => {
        setTimeout(() => {
            splash.close();
            mainWindow.show();
        }, 1500);
    });
});

function handleCloseEvents(mainWindow: BrowserWindow) {
    let willClose = false;

    mainWindow.on("close", (e) => {
        if (willClose) {
            return;
        }
        e.preventDefault();
        mainWindow.hide();
        if (app.dock) {
            app.dock.hide();
        }
    });

    app.on("before-quit", () => {
        willClose = true;
    });

    mainWindow.on("show", () => {
        willClose = false;
    });
}
