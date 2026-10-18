/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { z } from "zod";
import type { schemas } from "../../api/generated-schemas";

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
