/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { IconEye, IconEyeClosed } from "@tabler/icons-react";
import type {
    Action,
    Dropdown,
    MenuItem,
    Priority,
    RootMenuItem,
    Section,
} from "../../providers/MenuContext";

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

export function createToggleProcessingJobsItem(
    isWindowOpened: boolean,
    action: () => void,
): MenuItem {
    return {
        id: "toggle-processing-jobs",
        title: isWindowOpened ? "Hide Processing Jobs" : "Show Processing Jobs",
        icon: { icon: isWindowOpened ? IconEyeClosed : IconEye, position: "left" },
        task: {
            action: action,
            type: "direct",
        },
    };
}
