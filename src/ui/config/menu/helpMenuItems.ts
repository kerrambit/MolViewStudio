import {
    IconHome,
    IconProgressCheck,
    IconFlag,
    IconBrandGithub,
    IconTopologyStar3,
} from "@tabler/icons-react";
import { pushInfoNotification } from "../../services/NotificationService";
import type { MenuItem, Section } from "../../providers/MenuContext";

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
