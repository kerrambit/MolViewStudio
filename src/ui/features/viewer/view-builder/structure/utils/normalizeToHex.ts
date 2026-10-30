/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

// Helper to ensure Mantine ColorInput handles css text colors (like "green").
export function normalizeToHex(color: string): string {
    if (!color) return "#ffffff";
    if (color.startsWith("#")) return color;
    if (typeof document === "undefined") return color;

    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return color;

    ctx.fillStyle = color;
    return ctx.fillStyle;
}
