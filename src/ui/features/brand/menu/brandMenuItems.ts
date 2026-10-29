/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { IconBrandGithub, IconTopologyStar3 } from "@tabler/icons-react";
import type { MenuItem } from "../../menu/providers/MenuContext";

export function createVolSegStudioMenuItem(): MenuItem {
    return {
        id: "volsegstudio",
        title: "VolSegStudio GitHub",
        icon: { icon: IconBrandGithub, position: "left" },
        task: {
            action: () => {
                window.electron.requestToOpenExternal(
                    "https://github.com/kerrambit/VolSegStudio",
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
