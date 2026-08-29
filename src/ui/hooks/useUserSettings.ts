/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useContext } from "react";
import { UserSettingsContext } from "../providers/UserSettingsContext";

export function useUserSettings() {
    const context = useContext(UserSettingsContext);
    if (!context) {
        throw new Error("Settings must be used within UserSettingsProvider!");
    }
    return context;
}
