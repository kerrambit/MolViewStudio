/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import {
    IconPackageExport,
    IconBinaryTreeFilled,
    IconWorldDownload,
    IconArrowBack,
    IconArrowForward,
    IconHistory,
} from "@tabler/icons-react";
import { BroomIcon } from "../../components/icons/BroomIcon";
import type {
    Dropdown,
    Action,
    Priority,
    RootMenuItem,
    MenuItem,
    Section,
} from "../../providers/MenuContext";

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

export function createHistorySection(items: MenuItem[]): Section {
    return {
        id: "edit-history",
        items: items,
    };
}

export function createGeneralEditSection(items: MenuItem[]): Section {
    return {
        id: "edit-general",
        items: items,
    };
}

export function createUndoMenuItem(action: () => Promise<void>): MenuItem {
    return {
        id: "undo",
        title: "Undo",
        icon: { icon: IconArrowBack, position: "left" },
        task: {
            action: action,
            type: "direct",
        },
    };
}

export function createRedoMenuItem(action: () => Promise<void>): MenuItem {
    return {
        id: "redo",
        title: "Redo",
        icon: { icon: IconArrowForward, position: "left" },
        task: {
            action: action,
            type: "direct",
        },
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

export function createShowSourceTreeHistoryMenuItem(
    action: () => Promise<void>,
): MenuItem {
    return {
        id: "showSourceTreeHistory",
        title: "Show source tree history",
        icon: { icon: IconHistory, position: "left" },
        task: {
            action: action,
            type: "direct",
        },
    };
}
