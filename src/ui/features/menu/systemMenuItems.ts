import {
    IconCircleDashedX,
    IconFolderOpen,
    IconUserCog,
} from "@tabler/icons-react";
import type {
    Action,
    Dropdown,
    MenuItem,
    Priority,
    RootMenuItem,
    Section,
} from "../../services/MenuProvider";
import { type NavigateFunction } from "react-router-dom";

export function createOnlyDevSection(
    id: string,
    title: string,
    items: MenuItem[],
): Section {
    return {
        id: id,
        title: title,
        visible: () => {
            return window.electron.requestEnvironment().isDev;
        },
        items: items,
    };
}

export function createOpenDevToolsMenuItem(): MenuItem {
    return {
        id: "open-devtools",
        title: "Open DevTools",
        icon: { icon: IconUserCog, position: "left" },
        task: {
            action: () => {
                window.electron.requestToOpenDevTools();
            },
            type: "direct",
        },
    };
}

// --------------------------------------------------------------------------------------

export function createExitSection(items: MenuItem[]): Section {
    return {
        id: "file-exit",
        items: items,
    };
}

export function createExitMenuItem(action?: () => void): MenuItem {
    const defaultAction = () => {
        window.electron.requestApplicationExit();
    };

    return {
        id: "exit",
        title: "Exit",
        icon: { icon: IconCircleDashedX, position: "left" },
        task: {
            action: action ?? defaultAction,
            type: "direct",
        },
    };
}

// --------------------------------------------------------------------------------------

export function createGeneralFileSection(items: MenuItem[]): Section {
    return {
        id: "file-general",
        items: items,
    };
}

export function createFileRootMenuItem(
    task: Dropdown | Action,
    priority: Priority = 1,
): RootMenuItem {
    return {
        id: "file",
        title: "File",
        task: task,
        priority: priority,
    };
}

export function createOpenFileInViewerMenuItem(
    action: () => Promise<void>,
): MenuItem {
    return {
        id: "open-file-in-viewer",
        title: "Open file in viewer",
        icon: { icon: IconFolderOpen, position: "left" },
        task: {
            action: action,
            type: "secondary",
        },
    };
}

export function createProcessFileMenuItem(
    action: () => Promise<void>,
): MenuItem {
    return {
        id: "process-file",
        title: "Process file",
        icon: { icon: IconFolderOpen, position: "left" },
        task: {
            action: action,
            type: "secondary",
        },
    };
}

// --------------------------------------------------------------------------------------

export function createSettingsRootMenuItem(
    navigate: NavigateFunction,
    priority: Priority = 9,
): RootMenuItem {
    return {
        id: "settings",
        title: "Settings",
        task: {
            action: () => {
                navigate("/settings");
            },
            type: "direct",
        },
        priority: priority,
    };
}

// --------------------------------------------------------------------------------------

export function createHelpRootMenuItem(task: Dropdown | Action): RootMenuItem {
    return {
        id: "help",
        title: "Help",
        task: task,
        priority: 10,
    };
}
