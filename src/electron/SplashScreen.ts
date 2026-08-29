/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { BrowserWindow } from "electron";

export class SplashScreen {
    private splash: BrowserWindow | null;

    constructor(
        filePathToSplashGraphics: string,
        graphicsDimensions: { width: number; height: number },
    ) {
        this.splash = new BrowserWindow({
            width: graphicsDimensions.width,
            height: graphicsDimensions.height,
            transparent: true,
            frame: false,
            alwaysOnTop: true,
            show: false,
            focusable: false,
            resizable: false,
            movable: false,
            center: true,
            hasShadow: false,
            skipTaskbar: true,
        });

        this.splash.loadFile(filePathToSplashGraphics);
        this.splash.setIgnoreMouseEvents(true);

        this.splash.once("ready-to-show", () => {
            this.splash?.show();
        });
    }

    public close(): void {
        if (this.splash && !this.splash.isDestroyed()) {
            this.splash.close();
            this.splash = null;
        }
    }
}
