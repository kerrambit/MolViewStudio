import {
    createContext,
    useState,
    useEffect,
    type ReactNode,
    useContext,
} from "react";
import { themes, type ThemeType } from "../config/themes";
import {
    MantineProvider,
    useComputedColorScheme,
    useMantineColorScheme,
    useMantineTheme,
} from "@mantine/core";
import { useUserSettings } from "./UserSettingsProvider";
import { Notifications } from "@mantine/notifications";

type AppearanceContextType = {
    setColorTheme: (theme: ThemeType) => void;
    availableColorThemes: ThemeType[];
    niceColorThemeNames: Record<ThemeType, string>;
};

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

const AppearanceContext = createContext<AppearanceContextType | undefined>(
    undefined,
);

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

    // Current color theme, default value is "charcoal".
    const [currentThemeType, setCurrentThemeType] =
        useState<ThemeType>("charcoal");

    // Lists all available color themes.
    const availableColorThemes: ThemeType[] = Object.keys(
        themes,
    ) as ThemeType[];

    // When we get color theme from user settings, we check the validity of the value and set the it as current theme.
    useEffect(() => {
        const savedTheme = settings.colorTheme as ThemeType;
        if (savedTheme && availableColorThemes.includes(savedTheme)) {
            setCurrentThemeType(savedTheme);
        }
    }, [settings.colorTheme]);

    // Setter function for color theme, we also set new settings to be saved on disk.
    const setColorTheme = (colorTheme: ThemeType) => {
        setCurrentThemeType(colorTheme);
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
                    limit={5}
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
