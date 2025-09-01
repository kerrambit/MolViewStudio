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

    console.log(
        `Server path for developemnt: ${path.join(
            app.getAppPath(),
            "dist-server",
            executable
        )}, and for production: ${path.join(
            app.getAppPath(),
            "..",
            executable
        )}.`
    );

    if (isDev()) {
        return path.join(app.getAppPath(), "dist-server", executable);
    } else {
        return path.join(app.getAppPath(), "..", executable);
        // return path.join(process.resourcesPath, executable);
    }
}

export function getAssetsPath() {
    return path.join(app.getAppPath(), isDev() ? "." : "..", "/src/assets");
}

export function getTranslationsPath() {
    return path.join(app.getAppPath(), isDev() ? "." : "..", "/src/locales");
}
