import { createContext } from "react";

type UserSettingsContextType = {
    settings: UserSettings;
    setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
};

export const UserSettingsContext =
    createContext<UserSettingsContextType | null>(null);
