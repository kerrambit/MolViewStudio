/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import type { UseColorSchemeValue } from "@mantine/hooks";

export function computeOptimalYellow(colorScheme: UseColorSchemeValue) {
    return colorScheme === "dark" ? "#facc15" : "#c27803";
}
