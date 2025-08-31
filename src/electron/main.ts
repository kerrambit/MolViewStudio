import { app, BrowserWindow } from "electron";
import { isDev } from "./utils/util.js";
import {
    getAssetsPath,
    getPreloadPath,
    getServerPath,
    getUiPath,
} from "./pathResolver.js";
import { pollData } from "./logicMocker.js";
import { Ipc } from "./Ipc.Electron.js";
import http from "http";
import { createTray } from "./tray.js";
import { createMenu } from "./menu.js";
import path from "path";
import {
    loadUserSettings,
    saveUserSettings,
} from "./utils/localUserSettingsUtils.js";
import { spawn, spawnSync } from "child_process";
import { existsSync } from "fs";

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

    // Start the server and show splash screen for at least 1.5 seconds (splash screen will be displayed as long as server is starting).
    const splashDelay = new Promise((resolve) => setTimeout(resolve, 1500));
    Promise.all([runServer(userSettings.serverPort), splashDelay])
        .then(() => {
            console.log("Server is ready."); // TODO: log this
            splash.close();
            mainWindow.show();
        })
        .catch((err) => {
            console.error("Server failed to start:", err); // TODO: log this
            splash.close();
            mainWindow.show();
        });
});

function runServer(serverPort: number): Promise<void> {
    return new Promise((resolve, reject) => {
        const serverPath = getServerPath();

        if (!existsSync(serverPath)) {
            console.error(
                "Server binary was not found!" // TODO: log this
            );
        }

        const args = [
            "--host",
            "localhost",
            "--port",
            serverPort.toString(),
            "--env",
            isDev() ? "dev" : "prod",
            "--cors",
        ];

        // For Vite Hot-Reloading.
        if (isDev()) {
            ["http://localhost:5123", "http://127.0.0.1:5123"].forEach(
                (origin) => args.push(origin)
            );
        }

        const serverProcess = spawn(serverPath, args, { stdio: "inherit" });

        serverProcess.on("error", (err) => {
            reject(new Error(`Failed to start server process: ${err.message}`));
        });

        serverProcess.on("exit", (code) => {
            if (code !== 0) {
                reject(new Error(`Server process exited with code ${code}`));
            }
        });

        const waitForServer = (url: string, retries = 50, delay = 200) => {
            return new Promise<void>((res, rej) => {
                const attempt = () => {
                    http.get(url, () => res()).on("error", () => {
                        if (retries <= 0)
                            return rej(new Error("Server did not start!"));
                        retries--;
                        setTimeout(attempt, delay);
                    });
                };
                attempt();
            });
        };

        waitForServer(`http://localhost:${serverPort}/health`)
            .then(() => resolve())
            .catch((err) => reject(err));
    });
}

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
