import {
    IconCircleDashedX,
    IconInfoOctagon,
    IconUserCog,
} from "@tabler/icons-react";
import type {
    Action,
    Dropdown,
    MenuItem,
    Priority,
    RootMenuItem,
    Section,
} from "../../providers/MenuContext";

// ------------------ Default first root menu item - File -------------------------------

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

export function createExitSection(items: MenuItem[]): Section {
    return {
        id: "file-exit",
        items: items,
    };
}

export function createExitMenuItem(customExitAction?: () => void): MenuItem {
    const defaultAction = () => {
        window.electron.requestApplicationExit();
    };

    return {
        id: "exit",
        title: "Exit",
        icon: { icon: IconCircleDashedX, position: "left" },
        task: {
            action: customExitAction ?? defaultAction,
            type: "direct",
        },
    };
}

// ------------------ Default last root menu item - Help --------------------------------

export function createHelpRootMenuItem(task: Dropdown | Action): RootMenuItem {
    return {
        id: "help",
        title: "Help",
        task: task,
        priority: 10,
    };
}

export function createAboutSection(items: MenuItem[]): Section {
    return {
        id: "help-about",
        items: items,
    };
}

export function createAboutMenuItem(
    showAboutDialogueAction: () => Promise<void>,
): MenuItem {
    return {
        id: "about",
        title: "About",
        icon: { icon: IconInfoOctagon, position: "left" },
        task: {
            action: showAboutDialogueAction,
            type: "direct",
        },
    };
}
