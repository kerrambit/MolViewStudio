import {
    IconFilePlus,
    IconFileTime,
    IconFolderCog,
    IconFolderOpen,
} from "@tabler/icons-react";
import type {
    MenuItem,
    Section,
    LiveTaskType,
    Dropdown,
} from "../../providers/MenuContext";

export function createProjectActionsSection(items: MenuItem[]): Section {
    return {
        id: "project-actions",
        title: "Creation",
        items: items,
    };
}

export function createFileImportSection(items: MenuItem[]): Section {
    return {
        id: "file-import",
        title: "File Import",
        items: items,
    };
}

export function createUtilitiesSection(items: MenuItem[]): Section {
    return {
        id: "utilities",
        title: "Utilities",
        items: items,
    };
}

export function createOpenFileInViewerMenuItem(
    liveTask: LiveTaskType,
): MenuItem {
    return {
        id: "open-file-in-viewer",
        title: "Open file in viewer",
        icon: { icon: IconFolderOpen, position: "left" },
        task: {
            action: () => {},
            type: "secondary",
        },
        LiveTask: liveTask,
    };
}

export function createOpenRecentFileInViewerMenuItem(
    liveTask: LiveTaskType,
): MenuItem {
    return {
        id: "recent-file-in-viewer",
        icon: { icon: IconFileTime, position: "left" },
        title: "Open recent file in viewer",
        task: [] as Dropdown,
        LiveTask: liveTask,
    };
}

export function createCreateNewProjectMenuItem(
    liveTask: LiveTaskType,
): MenuItem {
    return {
        id: "create-new-project",
        title: "Create new project",
        icon: { icon: IconFilePlus, position: "left" },
        task: {
            action: () => {},
            type: "direct",
        },
        LiveTask: liveTask,
    };
}

export function createOpenUserDataFolderMenuItem(
    action: () => Promise<void>,
): MenuItem {
    return {
        id: "open-user-data-folder",
        title: "Open user data folder",
        icon: { icon: IconFolderCog, position: "left" },
        task: {
            action: action,
            type: "direct",
        },
    };
}
