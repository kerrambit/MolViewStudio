import { createTheme, type MantineColorsTuple } from "@mantine/core";

const oceanBlue: MantineColorsTuple = [
    "#e6f3ff",
    "#cce7ff",
    "#99d6ff",
    "#66c2ff",
    "#33adff",
    "#0099ff",
    "#0080e6",
    "#0066cc",
    "#004d99",
    "#003366",
];

const forestGreen: MantineColorsTuple = [
    "#e6f7e6",
    "#ccefcc",
    "#99df99",
    "#66cf66",
    "#33bf33",
    "#00af00",
    "#009900",
    "#007700",
    "#005500",
    "#003300",
];

export const themes = {
    ocean: createTheme({
        colors: {
            ocean: oceanBlue,
        },
        primaryColor: "ocean",
    }),

    forest: createTheme({
        colors: {
            forest: forestGreen,
        },
        primaryColor: "forest",
    }),
};

export type ThemeType = keyof typeof themes;
