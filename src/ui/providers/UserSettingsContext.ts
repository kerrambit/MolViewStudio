/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { createContext } from "react";

type UserSettingsContextType = {
    settings: UserSettings;
    setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
};

export const UserSettingsContext =
    createContext<UserSettingsContextType | null>(null);
