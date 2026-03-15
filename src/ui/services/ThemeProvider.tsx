import {
    createContext,
    useState,
    useEffect,
    type ReactNode,
    useContext,
} from "react";
import { themes, type ThemeType } from "../misc/themes";
import { MantineProvider, useMantineTheme } from "@mantine/core";
import { useUserSettings } from "./UserSettingsProvider";

type ThemeContextType = {
    themeType: ThemeType;
    setThemeType: (theme: ThemeType) => void;
    availableThemeTypes: ThemeType[];
    niceThemeTypeNames: Record<ThemeType, string>;
};

export function useTheme() {
    const context = useContext(ThemeContext);
    const mantineTheme = useMantineTheme();
    if (!context) {
        throw new Error("useTheme must be used within CustomThemeProvider");
    }
    return {
        theme: mantineTheme,
        ...context,
    };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Provides getter and setter for the color theme.
 * This function is also responsible for taking care of color scheme, but we do not need to provide any custom getters and setters, as Mantine has its own `useMantineColorScheme()` or `useComputedColorScheme()` for this job.
 * Mantine, however, does not offer setter for color theme, so that is why we have this context (note that for only getter, you can use Mantine's `useMantineTheme()`).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
    // User settings.
    const { settings, setSettings } = useUserSettings();

    // Current color theme, default value is "charcoal".
    const [currentThemeType, setCurrentThemeType] =
        useState<ThemeType>("charcoal");

    // Lists all available color themes.
    const availableThemeTypes: ThemeType[] = Object.keys(themes) as ThemeType[];

    // When we get color theme from user settings, we check the validity of the value and set the it as current theme.
    useEffect(() => {
        const savedTheme = settings.colorTheme as ThemeType;
        if (savedTheme && availableThemeTypes.includes(savedTheme)) {
            setCurrentThemeType(savedTheme);
        }
    }, [settings.colorTheme]);

    // Setter function for color theme, we also set new settings to be saved on disk.
    const setThemeType = (colorTheme: ThemeType) => {
        setCurrentThemeType(colorTheme);
        setSettings({ ...settings, colorTheme });
    };

    // Lists nices names of color themes.
    const niceThemeTypeNames = {
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
        <ThemeContext.Provider
            value={{
                themeType: currentThemeType,
                setThemeType,
                availableThemeTypes,
                niceThemeTypeNames,
            }}
        >
            <MantineProvider
                // There is only static property for color theme in Mantine (unlike colorSchemeManager for color scheme), that is why we also need to provide setThemeType individually.
                theme={themes[currentThemeType]}
                // Our overriden manager for color scheme.
                colorSchemeManager={colorSchemeManager}
            >
                {children}
            </MantineProvider>
        </ThemeContext.Provider>
    );
}
