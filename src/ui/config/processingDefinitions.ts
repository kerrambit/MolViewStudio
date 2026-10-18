/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { z } from "zod";
import { schemas } from "../api/generated-schemas";

export type ProcessVolumeRequest = z.infer<typeof schemas.ProcessVolumeRequest>;

type StripIndexSignature<T> = {
    [K in keyof T as string extends K ? never : number extends K ? never : K]: T[K];
};

type CleanProcessVolumeRequest = StripIndexSignature<ProcessVolumeRequest>;

export type ProcessVolumeRequestWithoutFilepaths = Omit<
    CleanProcessVolumeRequest,
    "temporary_directory" | "volume_filepaths" | "segmentations_filepaths"
>;

export type ProcessVolumeRequestWithoutFilepathsAndBundlingApproach = Omit<
    CleanProcessVolumeRequest,
    | "temporary_directory"
    | "volume_filepaths"
    | "segmentations_filepaths"
    | "bundling_approach"
>;

export type DownsamplingStrategy = z.infer<typeof schemas.DownsamplignAlgorithmKind>;

export function getDownsamplingStrategyOptions(): DownsamplingStrategy[] {
    return schemas.DownsamplignAlgorithmKind.options;
}

/**
 * Simple downsampling levels offered in the processing dialogue. The full list of strategies
 * remains available in the advanced options.
 */
export type DownsamplingLevel = "light" | "medium" | "strong";

/**
 * Maps a simple downsampling level to the underlying strategy.
 */
export const DOWNSAMPLING_LEVEL_TO_STRATEGY: Record<
    DownsamplingLevel,
    DownsamplingStrategy
> = {
    light: "nearest",
    medium: "tricubic",
    strong: "triquintic",
};

/**
 * Options of the simple downsampling levels.
 */
export function getDownsamplingLevelOptions(): DownsamplingLevel[] {
    return ["light", "medium", "strong"];
}

export type SerializerKind = z.infer<typeof schemas.SerializerKind>;

export function getSerializerKindOptions(): SerializerKind[] {
    return schemas.SerializerKind.options;
}

export type BundlingKind = z.infer<typeof schemas.BundlingKind>;

export function getBundlingKindOptions(): BundlingKind[] {
    return schemas.BundlingKind.options;
}
