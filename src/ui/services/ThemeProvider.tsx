import {
    createContext,
    useState,
    useEffect,
    type ReactNode,
    useContext,
} from "react";
import { themes, type ThemeType } from "../misc/themes";
import { MantineProvider, useMantineTheme } from "@mantine/core";

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

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [currentThemeType, setCurrentThemeType] =
        useState<ThemeType>("ocean");

    const availableThemeTypes: ThemeType[] = Object.keys(themes) as ThemeType[];

    useEffect(() => {
        const savedTheme = localStorage.getItem("custom-theme") as ThemeType;
        if (savedTheme && availableThemeTypes.includes(savedTheme)) {
            setCurrentThemeType(savedTheme);
        }
    }, []);

    const setThemeType = (theme: ThemeType) => {
        setCurrentThemeType(theme);
        localStorage.setItem("custom-theme", theme);
    };

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

    return (
        <ThemeContext.Provider
            value={{
                themeType: currentThemeType,
                setThemeType,
                availableThemeTypes,
                niceThemeTypeNames,
            }}
        >
            <MantineProvider theme={themes[currentThemeType]}>
                {children}
            </MantineProvider>
        </ThemeContext.Provider>
    );
}
