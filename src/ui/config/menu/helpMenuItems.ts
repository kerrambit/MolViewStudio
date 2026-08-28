/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

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
            action: async () => {
                // const buildInfo = window.electron.requestBuildInformation();
                // const updates = await window.electron.checkForUpdates();
                // if (updates) {
                //     if (buildInfo.appVersion === updates.version) {
                //         pushInfoNotification(`You are up to date!`);
                //     } else {
                //         pushInfoNotification(
                //             `Update to version ${updates.version} released on ${updates.releaseDate} is available! Restart application to ask for update.`,
                //         );
                //     }
                // } else {
                //     pushErrorNotification(
                //         `Not able to get information about updates at the moment.`,
                //     );
                // }
                pushInfoNotification("Checking for updates...");
                await window.electron.checkForUpdates();
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
