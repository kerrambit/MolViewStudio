/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { RESOLUTION_LEVEL_TO_INDEX, type ResolutionLevel } from "./ResolutionLevel";

/**
 * Parses the resolution index from the `_r{N}_` part of a file name.
 * @param filename file name produced by the serializer, e.g. `volume_r2_data.mrc`
 * @returns the resolution index, or `undefined` if the name does not contain one
 */
function parseResolutionIndex(filename: string): number | undefined {
    const match = filename.match(/_r(\d+)_/);
    return match ? parseInt(match[1], 10) : undefined;
}

/**
 * Picks the file whose resolution index is closest to the wanted resolution
 * and returns its position in `files`.
 * The target is clamped to the highest available index. If no file has a
 * resolution in its name, index `0` is returned.
 * @param files candidate files (must have a `name`)
 * @param resolution wanted resolution
 * @returns index of the chosen file in `files`, or `-1` if `files` is empty
 */
export function pickFileIndexByResolution<T extends { name: string }>(
    files: T[],
    resolution: ResolutionLevel,
): number {
    if (files.length === 0) {
        return -1;
    }

    const withResolution = files
        .map((file, index) => ({ index, resolution: parseResolutionIndex(file.name) }))
        .filter(
            (entry): entry is { index: number; resolution: number } =>
                entry.resolution !== undefined,
        );

    if (withResolution.length === 0) {
        return 0;
    }

    const clampedIndex = Math.min(
        RESOLUTION_LEVEL_TO_INDEX[resolution],
        Math.max(...withResolution.map((entry) => entry.resolution)),
    );

    return withResolution.reduce((best, current) =>
        Math.abs(current.resolution - clampedIndex) <
        Math.abs(best.resolution - clampedIndex)
            ? current
            : best,
    ).index;
}

/**
 * Picks the file whose resolution index is closest to the wanted resolution.
 * @param files candidate files (must have a `name`)
 * @param resolution wanted resolution
 * @returns the chosen file, or `undefined` if `files` is empty
 */
export function pickFileByResolution<T extends { name: string }>(
    files: T[],
    resolution: ResolutionLevel,
): T | undefined {
    return files[pickFileIndexByResolution(files, resolution)];
}
