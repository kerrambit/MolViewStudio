/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { IconLayoutSidebar } from "@tabler/icons-react";
import type {
    Action,
    Dropdown,
    MenuItem,
    Priority,
    RootMenuItem,
    Section,
} from "../../menu/providers/MenuContext";

export function createWindowsRootMenuItem(
    task: Dropdown | Action,
    priority: Priority = 2,
): RootMenuItem {
    return {
        id: "Windows",
        title: "Windows",
        task: task,
        priority: priority,
    };
}

export function createGeneralWindowsActionsSection(items: MenuItem[]): Section {
    return {
        id: "windows-general",
        items: items,
    };
}

export function createToggleProcessingJobsItem(action: () => void): MenuItem {
    return {
        id: "toggle-processing-jobs",
        title: "Toggle Processing Jobs",
        icon: { icon: IconLayoutSidebar, position: "left" },
        task: {
            action: action,
            type: "direct",
        },
    };
}

export function createToggleSceneManagerItem(action: () => void): MenuItem {
    return {
        id: "toggle-scene-manager",
        title: "Toggle Scene Manager",
        icon: { icon: IconLayoutSidebar, position: "left" },
        task: {
            action: action,
            type: "direct",
        },
    };
}
