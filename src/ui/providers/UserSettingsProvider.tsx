import React, {
    createContext,
    useState,
    type ReactNode,
    useContext,
    useCallback,
} from "react";
import { useTranslation } from "react-i18next";
import "../i18n";

type UserSettingsContextType = {
    settings: UserSettings;
    setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
};

export function useUserSettings() {
    const context = useContext(UserSettingsContext);
    if (!context) {
        throw new Error("Settings must be used within UserSettingsProvider");
    }
    return context;
}

export const UserSettingsContext =
    createContext<UserSettingsContextType | null>(null);

export function UserSettingsProvider({ children }: { children: ReactNode }) {
    // Use translation.
    const { i18n } = useTranslation();

    const [settings, setSettings] = useState<UserSettings>(() => {
        const settings = window.electron.requestUserSettings();
        if (settings.lang && settings.lang !== i18n.language) {
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
