import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { logger } from "./logger.js";

export function loadUserSettings(
    userDataPath: string,
    userSettingsFile: string,
): UserSettings {
    const defaultSettings: UserSettings = {
        lang: "en",
        preferredServerPort: 41050,
        serverPort: 41050,
        colorTheme: "charcoal",
        colorScheme: "light",
    };
    try {
        if (!existsSync(userDataPath)) {
            mkdirSync(userDataPath, { recursive: true });
        }

        if (existsSync(userSettingsFile)) {
            const content = readFileSync(userSettingsFile, "utf-8");
            return { ...defaultSettings, ...JSON.parse(content) };
        }

        writeFileSync(
            userSettingsFile,
            JSON.stringify(defaultSettings, null, 2),
            "utf-8",
        );

        return defaultSettings;
    } catch (err) {
        logger.warn(
            `Failed to load user settings! Default values will be used. Details: <${err}>.`,
        );
        return defaultSettings;
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
        const { serverPort, ...settingsToSave } = settings;

        writeFileSync(
            userSettingsFile,
            JSON.stringify(settingsToSave, null, 2),
            "utf-8",
        );
    } catch (err) {
        logger.error(`Failed to save user settings! Details: <${err}>.`);
    }
}
