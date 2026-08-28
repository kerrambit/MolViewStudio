/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

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

const sunsetOrange: MantineColorsTuple = [
    "#fff4e6",
    "#ffe9cc",
    "#ffd399",
    "#ffbd66",
    "#ffa733",
    "#ff9100",
    "#e67c00",
    "#cc6600",
    "#994d00",
    "#663300",
];

const royalPurple: MantineColorsTuple = [
    "#f3e6ff",
    "#e7ccff",
    "#d499ff",
    "#c166ff",
    "#ae33ff",
    "#9b00ff",
    "#8200e6",
    "#6900cc",
    "#4f0099",
    "#360066",
];

const crimsonRed: MantineColorsTuple = [
    "#ffe6e6",
    "#ffcccc",
    "#ff9999",
    "#ff6666",
    "#ff3333",
    "#ff0000",
    "#e60000",
    "#cc0000",
    "#990000",
    "#660000",
];

const goldenYellow: MantineColorsTuple = [
    "#fffce6",
    "#fff9cc",
    "#fff299",
    "#ffeb66",
    "#ffe433",
    "#ffdd00",
    "#e6c400",
    "#ccab00",
    "#998000",
    "#665500",
];

const deepTeal: MantineColorsTuple = [
    "#e6f9f7",
    "#ccf2ef",
    "#99e6df",
    "#66d9cf",
    "#33ccbf",
    "#00bfaf",
    "#00a699",
    "#008c7a",
    "#00735c",
    "#004d3d",
];

const lavenderPink: MantineColorsTuple = [
    "#fce6f7",
    "#f9ccef",
    "#f299df",
    "#ec66cf",
    "#e533bf",
    "#de00af",
    "#c70099",
    "#af007a",
    "#96005c",
    "#7d003d",
];

const charcoalGray: MantineColorsTuple = [
    "#f5f5f5",
    "#ebebeb",
    "#d6d6d6",
    "#c2c2c2",
    "#adadad",
    "#999999",
    "#808080",
    "#666666",
    "#4d4d4d",
    "#333333",
];

const skyBlue: MantineColorsTuple = [
    "#e6f7ff",
    "#ccefff",
    "#99dfff",
    "#66cfff",
    "#33bfff",
    "#00afff",
    "#0099e6",
    "#0080cc",
    "#006699",
    "#004d66",
];

const emeraldGreen: MantineColorsTuple = [
    "#e6fff2",
    "#ccffe6",
    "#99ffcc",
    "#66ffb3",
    "#33ff99",
    "#00ff80",
    "#00e673",
    "#00cc66",
    "#009950",
    "#006633",
];

const amberWarm: MantineColorsTuple = [
    "#fff8e6",
    "#fff1cc",
    "#ffe399",
    "#ffd566",
    "#ffc733",
    "#ffb900",
    "#e6a400",
    "#cc9200",
    "#996d00",
    "#664900",
];

export const ocean = createTheme({
    colors: {
        ocean: oceanBlue,
    },
    primaryColor: "ocean",
});

export const forest = createTheme({
    colors: {
        forest: forestGreen,
    },
    primaryColor: "forest",
});

export const sunset = createTheme({
    colors: {
        sunset: sunsetOrange,
    },
    primaryColor: "sunset",
});

export const royal = createTheme({
    colors: {
        royal: royalPurple,
    },
    primaryColor: "royal",
});
export const crimson = createTheme({
    colors: {
        crimson: crimsonRed,
    },
    primaryColor: "crimson",
});
export const golden = createTheme({
    colors: {
        golden: goldenYellow,
    },
    primaryColor: "golden",
});
export const teal = createTheme({
    colors: {
        teal: deepTeal,
    },
    primaryColor: "teal",
});
export const lavender = createTheme({
    colors: {
        lavender: lavenderPink,
    },
    primaryColor: "lavender",
});
export const charcoal = createTheme({
    colors: {
        charcoal: charcoalGray,
    },
    primaryColor: "charcoal",
});
export const sky = createTheme({
    colors: {
        sky: skyBlue,
    },
    primaryColor: "sky",
});
export const emerald = createTheme({
    colors: {
        emerald: emeraldGreen,
    },
    primaryColor: "emerald",
});
export const amber = createTheme({
    colors: {
        amber: amberWarm,
    },
    primaryColor: "amber",
});

export const themes = {
    ocean: ocean,
    forest: forest,
    sunset: sunset,
    royal: royal,
    crimson: crimson,
    golden: golden,
    teal: teal,
    lavender: lavender,
    charcoal: charcoal,
    sky: sky,
    emerald: emerald,
    amber: amber,
};

export type ThemeType = keyof typeof themes;
