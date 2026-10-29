/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { create } from "zustand";
import i18n from "../../../i18n";

export type UserSettingsStore = {
    settings: UserSettings;
    setSettings: (
        settings: UserSettings | ((prevSettings: UserSettings) => UserSettings),
    ) => void;
};

// Load initial settings from disk and synchronize i18n language.
const initialSettings = window.electron.requestUserSettings();
if (initialSettings.lang !== i18n.language) {
    i18n.changeLanguage(initialSettings.lang);
}

export const useUserSettingsStore = create<UserSettingsStore>((set, get) => ({
    settings: initialSettings,

    setSettings: (settings) => {
        const nextSettings =
            typeof settings === "function" ? settings(get().settings) : settings;

        // Persist new settings to disk.
        window.electron.changeUserSettings(nextSettings);

        set({ settings: nextSettings });
    },
}));
