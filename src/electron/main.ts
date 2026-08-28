/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { app, BrowserWindow, Menu } from "electron";
import path from "path";
import http from "http";
import { ChildProcess, spawn } from "child_process";
import { existsSync } from "fs";
import {
    getAssetsPath,
    getPreloadPath,
    getServerPath,
    getUiPath,
} from "./utils/pathResolver.js";
import { loadUserSettings } from "./services/localUserSettingsStorage.js";
import { isDev } from "./utils/devUtils.js";
import { createTray } from "./tray.js";
import { logger } from "./utils/logger.js";
import { getAvailablePort } from "./utils/portUtils.js";
import { SplashScreen } from "./SplashScreen.js";
import { registerAllIpcHandlers } from "./ipc/IpcRouter.js";

app.on("ready", async () => {
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

    // Create and show splash screen. Source: https://www.freepik.com/free-vector/superimposed-water-drop-shape-abstract-graphics-background_14803692.htm#fromView=search&page=1&position=5&uuid=851272e9-7991-4653-9e3f-c5086e86f2da&query=Splash+molecules.
    const splash = new SplashScreen(path.join(getAssetsPath(), "splash.png"), {
        width: 500,
        height: 300,
    });

    // Initialize logging.
    logger.initialize();
    logger.info("Application has started.");

    // ------------------------------------------------------------- //

    // Create user data path and user settings & recent files filepaths.
    const userDataPath = app.getPath("userData");
    const userSettingsFilePath = path.join(userDataPath, "userSettings.json");
    const recentFilesFilePath = path.join(userDataPath, "recentFiles.json");

    // Load the settings.
    const userSettings: UserSettings = loadUserSettings(
        userDataPath,
        userSettingsFilePath,
    );
    logger.info(
        `User settings has been loaded from <${userSettingsFilePath}>.`,
    );

    // Check if the prefered port from user settings is free.
    const serverPort = await getAvailablePort(userSettings.preferredServerPort);
    logger.info(`Resolved server port to use: <${serverPort}>.`);

    // Inject valid CSP.
    mainWindow.webContents.session.webRequest.onHeadersReceived(
        (details, callback) => {
            // Choose script restrictions depending on environment: Vite development server requires 'unsafe-inline' to run the dev script tags.
            const scriptSourceDirective = isDev()
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval';"
                : "script-src 'self';";

            callback({
                responseHeaders: {
                    ...details.responseHeaders,
                    "Content-Security-Policy": [
                        `default-src 'self' https://files.rcsb.org https://webchem.ncbr.muni.cz https://raw.githubusercontent.com https://www.ebi.ac.uk https://molstar.org; ` +
                            `connect-src 'self' http://localhost:${serverPort} ws://localhost:${serverPort} http://localhost:5123 ws://localhost:5123 https://files.rcsb.org https://webchem.ncbr.muni.cz https://raw.githubusercontent.com https://www.ebi.ac.uk https://molstar.org; ` +
                            `img-src 'self' data: blob: https:; ` +
                            `style-src 'self' 'unsafe-inline'; ` +
                            `${scriptSourceDirective}`, // Inject the conditional rules safely here.
                    ],
                },
            });
        },
    );

    // Registers all IPC handlers.
    registerAllIpcHandlers(mainWindow, userSettings, serverPort, {
        userDataPath,
        userSettingsFilePath,
        recentFilesFilePath,
    });

    // Create tray.
    createTray(mainWindow);

    // Do not create any menu (Linux and Win).
    Menu.setApplicationMenu(null);

    // Start the server and show splash screen for at least 1.5 seconds (splash screen will be displayed as long as server is starting).
    // We also handle close events here: mainly stopping the server when app is being stopped.
    Promise.all([
        runServer(serverPort),
        new Promise((resolve) => setTimeout(resolve, 1500)),
    ])
        .then((results) => {
            const serverProcess = results[0];
            logger.info(
                `Server with PID: <${serverProcess.pid}> is running on <localhost:${serverPort}>.`,
            );
            splash.close();
            mainWindow.show();
            handleCloseEvents(mainWindow, serverProcess);
        })
        .catch((err) => {
            logger.error(`Server failed to start! Details: ${err}.`);
            splash.close();
            mainWindow.show();
            handleCloseEvents(mainWindow, null);
        });
});

function runServer(serverPort: number): Promise<ChildProcess> {
    return new Promise((resolve, reject) => {
        const serverPath = getServerPath();

        if (!existsSync(serverPath)) {
            logger.error(`Server binary was not found on <${serverPath}>!`);
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
                (origin) => args.push(origin),
            );
        }

        const serverProcess = spawn(serverPath, args, {
            stdio: "inherit",
            windowsHide: true,
        });
        logger.info(
            `Server process has been spawned with arguments: <${args.join(
                " ",
            )}>`,
        );

        serverProcess.on("error", (err) => {
            reject(
                new Error(
                    `Failed to start server process! Details: <${err.message}>.`,
                ),
            );
        });

        serverProcess.on("exit", (code) => {
            if (code !== 0) {
                reject(new Error(`Server process exited with code <${code}>.`));
            }
        });

        // Try to connect to server at maximum for one minute.
        const waitForServer = (url: string, retries = 30, delay = 2000) => {
            return new Promise<void>((res, rej) => {
                const attempt = () => {
                    http.get(url, () => res()).on("error", () => {
                        if (retries <= 0)
                            return rej(
                                new Error("Failed to start server process!"),
                            );
                        retries--;
                        setTimeout(attempt, delay);
                    });
                };
                attempt();
            });
        };

        waitForServer(`http://localhost:${serverPort}`)
            .then(() => resolve(serverProcess))
            .catch((err) => reject(err));
    });
}

/**
 * Implements the "minimize to tray/background" behavior. This behavior is used by some other apps such as Discord or Teams.
 * Function also stops and quits the server process.
 * @param mainWindow main window to close
 * @param serverProcess server process or null if there is no server process to stop
 */
function handleCloseEvents(
    mainWindow: BrowserWindow,
    serverProcess: ChildProcess | null,
): void {
    let willClose = false;

    mainWindow.on("close", (e) => {
        if (willClose) {
            logger.info(`Application and server will be closed.\n`);
            quitServerProcess(serverProcess);
            serverProcess = null;
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

function quitServerProcess(serverProcess: ChildProcess | null) {
    if (serverProcess) {
        // Kill entire process tree on Windows.
        if (process.platform === "win32" && serverProcess.pid) {
            spawn(
                "taskkill",
                ["/pid", serverProcess.pid.toString(), "/t", "/f"],
                {
                    stdio: "ignore",
                },
            );
        } else {
            serverProcess.kill();
        }
    }
}
