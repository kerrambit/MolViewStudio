import {
    IconBinaryTreeFilled,
    IconBrandGithub,
    IconCircleDashedX,
    IconFileFilled,
    IconFilePlus,
    IconFileTime,
    IconFlag,
    IconFolderCog,
    IconFolderOpen,
    IconHome,
    IconInfoOctagon,
    IconPackageExport,
    IconProgressCheck,
    IconTopologyStar3,
    IconUserCog,
    IconWorldDownload,
} from "@tabler/icons-react";
import type {
    Action,
    Dropdown,
    LiveMenuRenderProps,
    MenuItem,
    Priority,
    RootMenuItem,
    Section,
} from "../providers/MenuProvider";
import { type NavigateFunction } from "react-router-dom";
import { pushInfoNotification } from "../services/NotificationService";
import { BroomIcon } from "../components/icons/BroomIcon";
import { useRecentFilesStore } from "../stores/recentFilesStore";

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

export function createOpenRecentFileInViewerMenuItem(
    action: (path: string) => Promise<void>,
): MenuItem {
    return {
        id: "recent-file-in-viewer",
        icon: { icon: IconFileTime, position: "left" },
        title: "Open recent file in viewer",
        task: [] as Dropdown,

        // We define our LiveTask here.
        LiveTask: ({ render }: LiveMenuRenderProps) => {
            // Use recent files.
            const recentFiles = useRecentFilesStore.getState().recentFiles;

            if (recentFiles.length === 0) return null;

            const liveDropdownTask: Dropdown = [
                {
                    id: "recent-files-sub-list",
                    items: recentFiles.map((path) => ({
                        id: `recent-file-${path}`,
                        icon: { icon: IconFileFilled, position: "left" },
                        title: path,
                        task: {
                            type: "direct",
                            action: () => action(path),
                        },
                    })),
                },
            ];

            return render(liveDropdownTask);
        },
    };
}

export function createCreateNewProjectMenuItem(action: () => void): MenuItem {
    return {
        id: "create-new-project",
        title: "Create new project",
        icon: { icon: IconFilePlus, position: "left" },
        task: {
            action: action,
            type: "direct",
        },
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

// --------------------------------------------------------------------------------------

export function createEditRootMenuItem(
    task: Dropdown | Action,
    priority: Priority = 2,
): RootMenuItem {
    return {
        id: "edit",
        title: "Edit",
        task: task,
        priority: priority,
    };
}

export function createGeneralEditSection(items: MenuItem[]): Section {
    return {
        id: "edit-general",
        items: items,
    };
}

export function createClearViwerMenuItem(
    action: () => Promise<void>,
): MenuItem {
    return {
        id: "clear-viewer",
        title: "Clear viewer",
        icon: { icon: BroomIcon, position: "left" },
        task: {
            action: action,
            type: "direct",
        },
    };
}

export function createExportViwerMenuItem(
    action: () => Promise<void>,
): MenuItem {
    return {
        id: "export",
        title: "Export",
        icon: { icon: IconPackageExport, position: "left" },
        task: {
            action: action,
            type: "direct",
        },
    };
}

export function createShowRawMVSTreeItemMenuItem(
    action: () => Promise<void>,
): MenuItem {
    return {
        id: "showRawMVSTree",
        title: "Show raw MVS tree",
        icon: { icon: IconBinaryTreeFilled, position: "left" },
        task: {
            action: action,
            type: "direct",
        },
    };
}

export function createLoadDefaultPDBItemMenuItem(
    action: () => Promise<void>,
): MenuItem {
    return {
        id: "load-default-pdb",
        title: "Load default PDB",
        icon: { icon: IconWorldDownload, position: "left" },
        task: {
            action: action,
            type: "direct",
        },
    };
}

export function createLoadDefaultMVSJtemMenuItem(
    action: () => Promise<void>,
): MenuItem {
    return {
        id: "load-default-mvsj",
        title: "Load default MVSJ",
        icon: { icon: IconWorldDownload, position: "left" },
        task: {
            action: action,
            type: "direct",
        },
    };
}

export function createLoadDefaultMVSXtemMenuItem(
    action: () => Promise<void>,
): MenuItem {
    return {
        id: "load-default-mvsx",
        title: "Load default MVSX",
        icon: { icon: IconWorldDownload, position: "left" },
        task: {
            action: action,
            type: "direct",
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

export function createGeneralHelpSection(items: MenuItem[]): Section {
    return {
        id: "help-general",
        items: items,
    };
}

export function createCheckForUpdatesSection(items: MenuItem[]): Section {
    return {
        id: "help-updates",
        items: items,
    };
}

export function createHomePageSection(items: MenuItem[]): Section {
    return {
        id: "home-page",
        items: items,
    };
}

export function createHomePageMenuItem(action: () => void): MenuItem {
    return {
        id: "homepage",
        title: "Home page",
        icon: { icon: IconHome, position: "left" },
        task: {
            action: () => {
                action();
            },
            type: "direct",
        },
    };
}

export function createCheckForUpdatesMenuItem(): MenuItem {
    return {
        id: "updates",
        title: "Check for updates",
        icon: { icon: IconProgressCheck, position: "left" },
        task: {
            action: () => {
                // TODO: wait for https://github.com/kerrambit/MolStarApp/issues/4
                pushInfoNotification(`You are up to date.`);
            },
            type: "direct",
        },
    };
}

export function createReportIssueMenuItem(): MenuItem {
    return {
        id: "report",
        title: "Report issue",
        icon: { icon: IconFlag, position: "left" },
        task: {
            action: () => {
                window.electron.requestToOpenExternal(
                    "https://github.com/kerrambit/MolStarApp/issues",
                );
            },
            type: "direct",
        },
    };
}

export function createMolViewStudioMenuItem(): MenuItem {
    return {
        id: "molviewstudio",
        title: "MolView Studio GitHub",
        icon: { icon: IconBrandGithub, position: "left" },
        task: {
            action: () => {
                window.electron.requestToOpenExternal(
                    "https://github.com/kerrambit/MolStarApp",
                );
            },
            type: "direct",
        },
    };
}

export function createMolstarMenuItem(): MenuItem {
    return {
        id: "molstar",
        title: "Molstar Website",
        icon: { icon: IconTopologyStar3, position: "left" },
        task: {
            action: () => {
                window.electron.requestToOpenExternal("https://molstar.org/");
            },
            type: "direct",
        },
    };
}

export function createAboutSection(items: MenuItem[]): Section {
    return {
        id: "help-about",
        items: items,
    };
}

export function createAboutMenuItem(action: () => Promise<void>): MenuItem {
    return {
        id: "about",
        title: "About",
        icon: { icon: IconInfoOctagon, position: "left" },
        task: {
            action: action,
            type: "direct",
        },
    };
}
