import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

export function loadUserSettings(
    userDataPath: string,
    userSettingsFile: string
): UserSettings {
    try {
        if (!existsSync(userDataPath)) {
            mkdirSync(userDataPath, { recursive: true });
        }

        if (existsSync(userSettingsFile)) {
            const content = readFileSync(userSettingsFile, "utf-8");
            return JSON.parse(content);
        }

        const defaultSettings: UserSettings = { lang: "en" };
        writeFileSync(
            userSettingsFile,
            JSON.stringify(defaultSettings, null, 2),
            "utf-8"
        );

        return defaultSettings;
    } catch (e) {
        return { lang: "en" };
    }
}

export function saveUserSettings(
    userDataPath: string,
    userSettingsFile: string,
    settings: UserSettings
) {
    try {
        if (!existsSync(userDataPath)) {
            mkdirSync(userDataPath, { recursive: true });
        }
        writeFileSync(
            userSettingsFile,
            JSON.stringify(settings, null, 2),
            "utf-8"
        );
    } catch (e) {
        console.error("Failed to save user settings:", e);
    }
}
