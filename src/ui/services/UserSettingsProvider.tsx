import React, {
    createContext,
    useState,
    useEffect,
    type ReactNode,
    useRef,
    useContext,
} from "react";
import { useTranslation } from "react-i18next";
import "../i18n";

type UserSettingsContextType = {
    settings: UserSettings;
    setSettings: React.Dispatch<React.SetStateAction<UserSettings | null>>;
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
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const didMount = useRef(false);
    const { i18n } = useTranslation();

    useEffect(() => {
        if (!didMount.current) {
            didMount.current = true;
            return;
        }
        if (settings) {
            window.electron.changeUserSettings(settings);
        }
    }, [settings]);

    useEffect(() => {
        window.electron
            .requestUserSettings()
            .then((newSettings: UserSettings) => {
                setSettings(newSettings);
                if (newSettings.lang && newSettings.lang !== i18n.language) {
                    i18n.changeLanguage(newSettings.lang);
                }
            });
    }, []);

    // TODO: replace with some pending/loading button.
    if (!settings) {
        return <div>Loading...</div>;
    }

    return (
        <UserSettingsContext.Provider value={{ settings, setSettings }}>
            {children}
        </UserSettingsContext.Provider>
    );
}
