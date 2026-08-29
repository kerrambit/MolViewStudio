/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useEffect } from "react";
import { useAppearance } from "../../../hooks/useAppearance";

// These imports tell Vite to bundle the CSS files and return their hashed URLs.
import lightSkinUrl from "molstar/lib/mol-plugin-ui/skin/light.scss?url";
import darkSkinUrl from "molstar/lib/mol-plugin-ui/skin/dark.scss?url";

export function useMolstarTheme() {
    // Use apperance.
    const { colorScheme } = useAppearance();

    useEffect(() => {
        const id = "molstar-theme-override";
        document.getElementById(id)?.remove();

        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = colorScheme === "dark" ? darkSkinUrl : lightSkinUrl;

        document.head.appendChild(link);

        return () => {
            document.getElementById(id)?.remove();
        };
    }, [colorScheme]);
}
