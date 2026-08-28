/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import type { Priority, RootMenuItem } from "../../providers/MenuContext";

export function createSettingsRootMenuItem(
    action: () => void,
    priority: Priority = 9,
): RootMenuItem {
    return {
        id: "settings",
        title: "Settings",
        task: {
            action: action,
            type: "direct",
        },
        priority: priority,
    };
}
