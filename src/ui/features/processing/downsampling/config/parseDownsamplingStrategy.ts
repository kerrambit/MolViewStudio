/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import {
    getDownsamplingStrategyOptions,
    type DownsamplingStrategy,
} from "./DownsamplingStrategy";

/**
 * Parses a raw downsampling method string (e.g. stored in user settings) into a valid
 * `DownsamplingStrategy`. Falls back to the given fallback when the value is not a known strategy.
 * @param value raw string, e.g. `"tricubic"`
 * @param fallback strategy used when the value is invalid
 * @returns the parsed strategy
 */
export function parseDownsamplingStrategy(
    value: string,
    fallback: DownsamplingStrategy,
): DownsamplingStrategy {
    return getDownsamplingStrategyOptions().includes(value as DownsamplingStrategy)
        ? (value as DownsamplingStrategy)
        : fallback;
}
