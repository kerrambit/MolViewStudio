/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useUserSettingsStore } from "../../../settings/stores/userSettingsStore";

export function useProcessingDomain() {
    const serverPort = useUserSettingsStore((state) => state.settings.serverPort);
    return {
        http: `http://localhost:${serverPort}`,
        ws: `ws://localhost:${serverPort}`,
    };
}
