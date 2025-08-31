import { app } from "electron";
import path from "path";
import { isDev } from "./utils/util.js";

export function getPreloadPath(): string {
    return path.join(
        app.getAppPath(),
        isDev() ? "." : "..",
        "/dist-electron/preload.cjs"
    );
}

export function getUiPath(): string {
    return path.join(app.getAppPath(), "dist-react/index.html");
}

export function getServerPath(): string {
    const executable =
        process.platform === "win32"
            ? "MolStarAppServer.exe"
            : "MolStarAppServer";
    return path.join(app.getAppPath(), "dist-server", executable);
}

export function getAssetsPath() {
    return path.join(app.getAppPath(), isDev() ? "." : "..", "/src/assets");
}

export function getTranslationsPath() {
    return path.join(app.getAppPath(), isDev() ? "." : "..", "/src/locales");
}
