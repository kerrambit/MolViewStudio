/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useUserSettings } from "../../hooks/useUserSettings";

export function useDomain() {
    const userSettings = useUserSettings();
    return {
        http: `http://localhost:${userSettings.settings.serverPort}`,
        ws: `ws://localhost:${userSettings.settings.serverPort}`,
    };
}
