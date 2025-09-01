import { app, BrowserWindow, Menu } from "electron";
import { isDev } from "./utils/util.js";
import { getTranslationsPath } from "./pathResolver.js";
import { readFileSync } from "fs";
import path from "path";
import { logger } from "./utils/logger.js";

export function createMenu(mainWindow: BrowserWindow, lang: Language) {
    const translations = loadLocalTranslation(lang);

    Menu.setApplicationMenu(
        Menu.buildFromTemplate([
            {
                label: process.platform === "darwin" ? undefined : "Mol* App",
                type: "submenu",
                submenu: [
                    {
                        label: translations.devtools,
                        click: () => mainWindow.webContents.openDevTools(),
                        visible: isDev(),
                    },
                    {
                        label: translations.quitElectron,
                        click: () => {
                            app.quit();
                        },
                    },
                ],
            },
        ])
    );
}

type MenuTranslations = {
    quitElectron: string;
    devtools: string;
};

// TODO: these translation should be memoized somehow
function loadLocalTranslation(lang: Language): MenuTranslations {
    const translationsPath = getTranslationsPath();

    logger.info(
        `Translations will be read from <${translationsPath}> and used for Menu creation.`
    );

    try {
        const enJson = readFileSync(
            path.join(translationsPath, "en", "translation.json"),
            "utf-8"
        );
        const deJson = readFileSync(
            path.join(translationsPath, "de", "translation.json"),
            "utf-8"
        );

        let t;
        if (lang === "en") {
            t = JSON.parse(enJson);
        } else if (lang === "de") {
            t = JSON.parse(deJson);
        }

        return {
            quitElectron: t.menu["Quit Mol* App"],
            devtools: t.menu["DevTools"],
        };
    } catch (err) {
        logger.warn(
            `Error occured when reading translations. Default values will be used. Details: <${err}>.`
        );
        return {
            quitElectron: "Quit Mol* App",
            devtools: "DevTools",
        };
    }
}
