import { app, BrowserWindow, dialog, Menu } from "electron";
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
import path from "path";
import {
    loadUserSettings,
    saveUserSettings,
} from "./utils/localUserSettingsUtils.js";
import { ChildProcess, spawn } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { writeFile, mkdir } from "fs/promises";
import { logger } from "./utils/logger.js";

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

    // Show splash screen. Source: https://www.freepik.com/free-vector/superimposed-water-drop-shape-abstract-graphics-background_14803692.htm#fromView=search&page=1&position=5&uuid=851272e9-7991-4653-9e3f-c5086e86f2da&query=Splash+molecules.
    splash.loadFile(path.join(getAssetsPath(), "splash.png"));
    splash.center();

    // Initialize logging.
    logger.initialize();
    logger.info("Application has started.");

    // ------------------------------------------------------------- //

    // Electron can send information in certain interval to UI component.
    pollData(mainWindow);

    // Create user data path and filepah.
    const userDataPath = app.getPath("userData");
    const userSettingsFile = path.join(userDataPath, "userSettings.json");

    // Load the settings.
    const userSettings: UserSettings = loadUserSettings(
        userDataPath,
        userSettingsFile,
    );
    logger.info(`User settings has been loaded from <${userSettingsFile}>.`);

    // If UI requests user settings, send it.
    Ipc.Electron.handle("requestUserSettings", () => {
        return userSettings;
    });

    // If UI requests to quit the application, exit procedure is executed.
    Ipc.Electron.handle("requestApplicationExit", () => {
        app.quit();
    });

    // If UI requests to open DevTools, and the application is in dev mode, allow it.
    Ipc.Electron.handle("requestToOpenDevTools", () => {
        if (isDev()) {
            mainWindow.webContents.openDevTools();
        }
    });

    Ipc.Electron.handleTwoWay("getFileData", (paths: string[]) => {
        const collectedFileData: FileData[] = [];
        paths.map((filePath: string) => {
            try {
                const fileName = path.basename(filePath);
                const fileExtension = path
                    .extname(filePath)
                    .toLowerCase()
                    .slice(1);

                let fileContent: string | Uint8Array<ArrayBuffer>;
                if (
                    fileExtension === "mvsx" ||
                    fileExtension === "cvsx" ||
                    fileExtension === "bcif" ||
                    fileExtension === "map"
                ) {
                    const buffer = readFileSync(filePath);
                    fileContent = new Uint8Array(buffer);
                } else if (fileExtension === "mvsj") {
                    fileContent = readFileSync(filePath, "utf8");
                } else {
                    fileContent = readFileSync(filePath, "utf8");
                }

                collectedFileData.push({
                    path: filePath,
                    extension: fileExtension,
                    name: fileName,
                    binary:
                        fileExtension === "cvsx" ||
                        fileExtension === "mvsx" ||
                        fileExtension === "bcif" ||
                        fileExtension === "map",
                    content: fileContent,
                });
            } catch (err) {
                logger.error(
                    `While reading file <${filePath}>, an error occured: <${err}>!`,
                );
                throw new Error(`Failed to read file: ${err}`);
            }
        });

        return collectedFileData;
    });

    // A request from UI to save data into filesystem.
    Ipc.Electron.handleTwoWay("saveData", async (pck: SaveDataPackage) => {
        return await saveFile(pck.path, pck.data);
    });

    // A request from UI to save temporary data into filesystem.
    Ipc.Electron.handleTwoWay(
        "saveTemporaryData",
        async (pck: SaveDataPackage) => {
            const fullFilePath = path.join(app.getPath("userData"), pck.path);
            return await saveFile(fullFilePath, pck.data);
        },
    );

    // If there is a change of settings coming from UI, we have to update menu, and store changes.
    Ipc.Electron.on("changeUserSettings", (settings: UserSettings) => {
        saveUserSettings(userDataPath, userSettingsFile, settings);
        logger.info(`User settings has been saved.`);
    });

    // UI can request environmanet information.
    Ipc.Electron.handleSync("requestEnvironment", () => {
        return { isDev: isDev(), userDataPath: app.getPath("userData") };
    });

    // TODO: unify the file processing in UI's dropzone component
    // TODO: openFileExplorer should take props which decied if multi-selection is enabled, right now, we have to enable it by default
    Ipc.Electron.handle("openFileExplorer", async () => {
        const openDialogResult = await dialog.showOpenDialog({
            properties: ["openFile", "multiSelections"],
            filters: [
                {
                    name: "All Files",
                    extensions: ["*"],
                },
                {
                    name: "MVS Extension Files",
                    extensions: ["mvsj", "mvsx"],
                },
                {
                    name: "Structural Files",
                    extensions: ["pdb", "cif", "bcif", "mcif", "sdf"],
                },
                {
                    name: "CVSX Files",
                    extensions: ["cvsx"],
                },
                {
                    name: "Volume Files",
                    extensions: ["map"],
                },
            ],
        });

        if (
            openDialogResult.canceled ||
            openDialogResult.filePaths.length === 0
        ) {
            return null;
        }

        const collectedFileData: FileData[] = [];
        openDialogResult.filePaths.map((filePath: string) => {
            try {
                const fileName = path.basename(filePath);
                const fileExtension = path
                    .extname(filePath)
                    .toLowerCase()
                    .slice(1);

                let fileContent: string | Uint8Array<ArrayBuffer>;
                if (
                    fileExtension === "mvsx" ||
                    fileExtension === "cvsx" ||
                    fileExtension === "bcif" ||
                    fileExtension === "map"
                ) {
                    const buffer = readFileSync(filePath);
                    fileContent = new Uint8Array(buffer);
                } else if (fileExtension === "mvsj") {
                    fileContent = readFileSync(filePath, "utf8");
                } else {
                    fileContent = readFileSync(filePath, "utf8");
                }

                collectedFileData.push({
                    path: filePath,
                    extension: fileExtension,
                    name: fileName,
                    binary:
                        fileExtension === "cvsx" ||
                        fileExtension === "mvsx" ||
                        fileExtension === "bcif" ||
                        fileExtension === "map",
                    content: fileContent,
                });
            } catch (err) {
                logger.error(
                    `While reading file <${filePath}>, an error occured: <${err}>!`,
                );
                throw new Error(`Failed to read file: ${err}`);
            }
        });

        return collectedFileData;
    });

    // Create tray.
    createTray(mainWindow);
    // Do not create any menu (Linux and Win).
    Menu.setApplicationMenu(null);

    // Start the server and show splash screen for at least 1.5 seconds (splash screen will be displayed as long as server is starting).
    // We also handle close events here: mainly stopping the server when app is being stopped.
    Promise.all([
        runServer(userSettings.serverPort),
        (resolve: () => {}) => setTimeout(resolve, 1500),
    ])
        .then((results) => {
            const serverProcess = results[0];
            logger.info(
                `Server with PID: <${serverProcess.pid}> is running on <localhost:${userSettings.serverPort}>.`,
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

        const waitForServer = (url: string, retries = 50, delay = 200) => {
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

        waitForServer(`http://localhost:${serverPort}/health`)
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
            logger.info("Application and server will be closed.");
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

async function saveFile(fullFilePath: string, data: ArrayBuffer) {
    const directoryPath = path.dirname(fullFilePath);

    logger.info(`Received data for saving to path <${fullFilePath}>.`);

    try {
        await mkdir(directoryPath, { recursive: true });

        const arrayBuffer = data;
        const buffer = Buffer.from(arrayBuffer);

        await writeFile(fullFilePath, buffer);

        // TODO: send a success message back to the Renderer
        logger.info(`Successfully saved file to <${fullFilePath}>.`);

        return true;
    } catch (error) {
        // TODO: send a failure message back to the Renderer
        logger.error(
            `Failed to save file <${fullFilePath}>! Details: <${
                (error as Error).message
            }>.`,
            error,
        );
        return false;
    }
}
