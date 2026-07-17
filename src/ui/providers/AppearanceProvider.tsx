import { type ReactNode } from "react";
import { themes, type ThemeType } from "../config/themes";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { useUserSettings } from "../hooks/useUserSettings";
import { AppearanceContext } from "./AppearanceContext";

/**
 * Provides all appearance-related state for the app: color theme and color scheme.
 *
 * - **Color theme** (ocean, charcoal, forest, …): fully managed here.
 *   Loaded from user settings on mount, persisted back on change.
 *   Passed to `MantineProvider` as a static `theme` prop — Mantine itself
 *   has no built-in manager for this, which is why this provider exists.
 *
 * - **Color scheme** (light / dark): managed via a custom `colorSchemeManager`
 *   passed to `MantineProvider`, which overrides Mantine's default
 *   `localStorage` behaviour. Reads and writes through `UserSettingsContext`
 *   so the value is persisted to disk alongside other user settings.
 *   Use Mantine's own `useMantineColorScheme()` or `useComputedColorScheme()`
 *   to read/set it, or use the `useAppearance()` hook which wraps both.
 *
 * ## Requirements
 * Must be rendered inside `UserSettingsProvider`, as it depends on
 * `useUserSettings()` to read and persist settings.
 */
export function AppearanceProvider({ children }: { children: ReactNode }) {
    // User settings.
    const { settings, setSettings } = useUserSettings();

    // Lists all available color themes.
    const availableColorThemes: ThemeType[] = Object.keys(
        themes,
    ) as ThemeType[];

    // Current color theme, default value is "charcoal".
    const savedTheme = settings.colorTheme as ThemeType;
    const currentThemeType: ThemeType =
        savedTheme && availableColorThemes.includes(savedTheme)
            ? savedTheme
            : "charcoal";

    // Setter function for color theme, we also set new settings to be saved on disk.
    const setColorTheme = (colorTheme: ThemeType) => {
        setSettings({ ...settings, colorTheme });
    };

    // Lists nices names of color themes.
    const niceColorThemeNames = {
        ocean: "Ocean Blue",
        forest: "Forest Green",
        sunset: "Sunset Orange",
        royal: "Royal Purple",
        crimson: "Crimson Red",
        golden: "Golden Yellow",
        teal: "Deep Teal",
        lavender: "Lavender Pink",
        charcoal: "Charcoal Gray",
        sky: "Sky Blue",
        emerald: "Emerald Green",
        amber: "Amber Warm",
    };

    // To retrieve/set color scheme value from our external storage (by default uses window.localStorage by Mantine library, we want to use our user settings approach).
    const colorSchemeManager = {
        get: () => settings.colorScheme,
        set: (value: "light" | "dark" | "auto") =>
            setSettings({
                ...settings,
                colorScheme: value === "auto" ? "light" : value,
            }),
        subscribe: () => () => {},
        unsubscribe: () => {},
        clear: () => {},
    };

    return (
        <AppearanceContext.Provider
            value={{
                setColorTheme,
                availableColorThemes,
                niceColorThemeNames,
            }}
        >
            <MantineProvider
                // There is only static property for color theme in Mantine (unlike colorSchemeManager for color scheme), that is why we also need to provide setThemeType individually.
                theme={themes[currentThemeType]}
                // Our overriden manager for color scheme.
                colorSchemeManager={colorSchemeManager}
            >
                <Notifications
                    limit={5} // TODO: limit in the settings
                    // We use "top-right" position for notifications and we need to put the first notification little lower so it does not collied with our header component.
                    styles={{
                        root: { top: 55, pointerEvents: "none" },
                        notification: { pointerEvents: "all" },
                    }}
                />
                {children}
            </MantineProvider>
        </AppearanceContext.Provider>
    );
}
