/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { logger } from "../utils/logger.js";

const DEFAULT_SETTINGS: UserSettings = {
    lang: "en",
    preferredServerPort: 41050,
    serverPort: 41050,
    colorTheme: "charcoal",
    colorScheme: "light",
    // TODO: we should not hard-coded `export` properties here but left them undefined and make `constants.ts` in `features/export/domain`
    export: {
        bundleAllLocalAssets: false,
        processAllLocalAssets: false,
        showAdvancedExportOptions: false,
    },
};

export function loadUserSettings(
    userDataPath: string,
    userSettingsFile: string,
): UserSettings {
    try {
        if (!existsSync(userDataPath)) {
            mkdirSync(userDataPath, { recursive: true });
        }

        if (existsSync(userSettingsFile)) {
            const content = readFileSync(userSettingsFile, "utf-8");
            return { ...DEFAULT_SETTINGS, ...JSON.parse(content) };
        }

        writeFileSync(
            userSettingsFile,
            JSON.stringify(DEFAULT_SETTINGS, null, 2),
            "utf-8",
        );

        return DEFAULT_SETTINGS;
    } catch (err) {
        logger.warn(
            `Failed to load user settings! Default values will be used. Details: <${err}>.`,
        );
        return DEFAULT_SETTINGS;
    }
}

export function saveUserSettings(
    userDataPath: string,
    userSettingsFile: string,
    settings: UserSettings,
) {
    try {
        if (!existsSync(userDataPath)) {
            mkdirSync(userDataPath, { recursive: true });
        }

        // We do not store (actual) server port, only preferred server port.
        const { ...settingsToSave } = settings;

        writeFileSync(userSettingsFile, JSON.stringify(settingsToSave, null, 2), "utf-8");
    } catch (err) {
        logger.error(`Failed to save user settings! Details: <${err}>.`);
    }
}
