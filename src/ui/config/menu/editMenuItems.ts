import {
    IconPackageExport,
    IconBinaryTreeFilled,
    IconWorldDownload,
} from "@tabler/icons-react";
import { BroomIcon } from "../../components/icons/BroomIcon";
import type {
    Action,
    Dropdown,
    MenuItem,
    Priority,
    RootMenuItem,
    Section,
} from "../../providers/MenuProvider";

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
