/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { getResolutionLevelOptions, type ResolutionLevel } from "./ResolutionLevel";

/**
 * Parses a raw resolution level string into a valid `ResolutionLevel`.
 * Falls back to the given fallback when the value is not a known level.
 * @param value raw string, e.g. `"high"`
 * @param fallback level used when the value is invalid
 * @returns the parsed resolution level
 */
export function parseResolutionLevel(
    value: string,
    fallback: ResolutionLevel,
): ResolutionLevel {
    return getResolutionLevelOptions().includes(value as ResolutionLevel)
        ? (value as ResolutionLevel)
        : fallback;
}
