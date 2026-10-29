/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { IconBrandGithub, IconTopologyStar3 } from "@tabler/icons-react";
import type { MenuItem } from "../../menu/providers/MenuContext";

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
