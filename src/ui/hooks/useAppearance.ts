import { useContext } from "react";
import { AppearanceContext } from "../providers/AppearanceContext";
import {
    useComputedColorScheme,
    useMantineColorScheme,
    useMantineTheme,
} from "@mantine/core";

/**
 * Hook to access appearance-related state and controls.
 *
 * Combines our own color theme context with Mantine's built-in
 * color scheme hooks into a single convenient interface.
 *
 * **Color scheme** (light / dark):
 * - `colorScheme` — the resolved value, always `"light"` or `"dark"`, never `"auto"`
 * - `setColorScheme` — updates the color scheme and persists it via `colorSchemeManager`
 *
 * **Color theme** (ocean, forest, charcoal, …):
 * - `colorTheme` — the full resolved Mantine theme object for the active color theme
 * - `setColorTheme` — switches the active color theme and persists it to user settings
 * - `availableColorThemes` — list of all valid color theme keys
 * - `niceColorThemeNames` — display names for each color theme key
 */
export function useAppearance() {
    const context = useContext(AppearanceContext);
    if (!context) {
        throw new Error("useAppearance must be used within AppearanceProvider");
    }

    return {
        colorScheme: useComputedColorScheme("light"),
        setColorScheme: useMantineColorScheme().setColorScheme,
        colorTheme: useMantineTheme(),
        ...context,
    };
}
