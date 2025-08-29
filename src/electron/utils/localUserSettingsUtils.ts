import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { log } from './log.js'

export function loadUserSettings(userDataPath: string, userSettingsFile: string): UserSettings {
    try {
        if (!existsSync(userDataPath)) {
            mkdirSync(userDataPath, { recursive: true });
            log(`Created user data folder: ${userDataPath}`);
        }

        if (existsSync(userSettingsFile)) {
            log(`Loading existing user settings: ${userSettingsFile}`);
            const content = readFileSync(userSettingsFile, 'utf-8');
            return JSON.parse(content);
        }

        const defaultSettings: UserSettings = { lang: 'en' };
        writeFileSync(userSettingsFile, JSON.stringify(defaultSettings, null, 2), 'utf-8');
        log(`Created user settings file with default language: ${defaultSettings.lang}`);

        return defaultSettings;
    } catch (e) {
        log(`Failed to load/create user settings: ${e}`);
        return { lang: 'en' };
    }
}

   export function saveUserSettings(userDataPath: string, userSettingsFile: string, settings: UserSettings) {
        try {
            if (!existsSync(userDataPath)) {
                mkdirSync(userDataPath, { recursive: true });
            }
            writeFileSync(userSettingsFile, JSON.stringify(settings, null, 2), 'utf-8');
            console.log('User settings saved successfully');
        } catch (e) {
            console.error('Failed to save user settings:', e);
        }
    }