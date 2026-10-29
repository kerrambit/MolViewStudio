/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useEffect } from "react";
import { useFileMappingsStore } from "../stores/fileMappingsStore";

/**
 * Loads the managed asset file mappings from the user data folder once at application start.
 * Renders nothing.
 */
export function FileMappingsManager() {
    const loadMappings = useFileMappingsStore((state) => state.loadMappings);

    useEffect(() => {
        loadMappings();
    }, [loadMappings]);

    return null;
}
