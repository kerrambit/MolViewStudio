/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { app } from "electron";
import path from "path";
import { isDev } from "./devUtils.js";

export function getPreloadPath(): string {
    return path.join(
        app.getAppPath(),
        isDev() ? "." : "..",
        "/dist-electron/preload.cjs",
    );
}

export function getUiPath(): string {
    return path.join(app.getAppPath(), "dist-react/index.html");
}

export function getServerPath(): string {
    const executable =
        process.platform === "win32"
            ? "MolViewStudioServer.exe"
            : "MolViewStudioServer";

    if (isDev()) {
        return path.join(app.getAppPath(), "dist-server", executable);
    } else {
        return path.join(app.getAppPath(), "..", executable);
    }
}

export function getAssetsPath() {
    return path.join(app.getAppPath(), isDev() ? "." : "..", "/src/assets");
}

export function getTranslationsPath() {
    return path.join(app.getAppPath(), isDev() ? "." : "..", "/src/locales");
}
