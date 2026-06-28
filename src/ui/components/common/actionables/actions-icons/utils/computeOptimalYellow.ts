import type { UseColorSchemeValue } from "@mantine/hooks";

export function computeOptimalYellow(colorScheme: UseColorSchemeValue) {
    return colorScheme === "dark" ? "#facc15" : "#c27803";
}
