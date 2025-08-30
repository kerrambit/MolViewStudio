import {
    createContext,
    useState,
    useEffect,
    type ReactNode,
    useContext,
} from "react";
import { themes, type ThemeType } from "./themes";
import { MantineProvider, useMantineTheme } from "@mantine/core";

type ThemeContextType = {
    themeType: ThemeType;
    setThemeType: (theme: ThemeType) => void;
    availableThemesTypes: ThemeType[];
};

export function useTheme() {
    const context = useContext(ThemeContext);
    const mantineTheme = useMantineTheme();
    if (!context) {
        throw new Error("useTheme must be used within CustomThemeProvider");
    }
    return {
        ...context,
        theme: mantineTheme,
    };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [currentThemeType, setCurrentThemeType] =
        useState<ThemeType>("ocean");
    const availableThemesTypes: ThemeType[] = ["ocean", "forest"];

    useEffect(() => {
        const savedTheme = localStorage.getItem("custom-theme") as ThemeType;
        if (savedTheme && availableThemesTypes.includes(savedTheme)) {
            setCurrentThemeType(savedTheme);
        }
    }, []);

    const setThemeType = (theme: ThemeType) => {
        setCurrentThemeType(theme);
        localStorage.setItem("custom-theme", theme);
    };

    return (
        <ThemeContext.Provider
            value={{
                themeType: currentThemeType,
                setThemeType,
                availableThemesTypes,
            }}
        >
            <MantineProvider theme={themes[currentThemeType]}>
                {children}
            </MantineProvider>
        </ThemeContext.Provider>
    );
}
