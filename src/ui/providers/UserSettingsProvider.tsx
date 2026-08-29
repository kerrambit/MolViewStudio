/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import React, { useState, type ReactNode, useCallback } from "react";
import { useTranslation } from "react-i18next";
import "../i18n";
import { UserSettingsContext } from "./UserSettingsContext";

export function UserSettingsProvider({ children }: { children: ReactNode }) {
    // Use translation.
    const { i18n } = useTranslation();

    const [settings, setSettings] = useState<UserSettings>(() => {
        const settings = window.electron.requestUserSettings();
        if (settings.lang !== i18n.language) {
            i18n.changeLanguage(settings.lang);
        }
        return settings;
    });

    const setSettingsCallback = useCallback(
        (action: React.SetStateAction<UserSettings>) => {
            setSettings((prev) => {
                const nextSettings =
                    typeof action === "function"
                        ? (action as (prev: UserSettings) => UserSettings)(prev)
                        : action;

                window.electron.changeUserSettings(nextSettings);

                return nextSettings;
            });
        },
        [],
    );

    return (
        <UserSettingsContext.Provider
            value={{ settings, setSettings: setSettingsCallback }}
        >
            {children}
        </UserSettingsContext.Provider>
    );
}
