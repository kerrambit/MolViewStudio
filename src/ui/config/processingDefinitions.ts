import { z } from "zod";
import { schemas } from "../api/generated-schemas";

export type ProcessVolumeRequest = z.infer<typeof schemas.ProcessVolumeRequest>;

type StripIndexSignature<T> = {
    [K in keyof T as string extends K
        ? never
        : number extends K
        ? never
        : K]: T[K];
};

type CleanProcessVolumeRequest = StripIndexSignature<ProcessVolumeRequest>;

export type ProcessVolumeRequestWithoutFilepaths = Omit<
    CleanProcessVolumeRequest,
    "temporary_directory" | "volume_filepaths" | "segmentations_filepaths"
>;

export type DownsamplingStrategy = z.infer<
    typeof schemas.DownsamplignAlgorithmKind
>;

export function getDownsamplingStrategyOptions(): DownsamplingStrategy[] {
    return schemas.DownsamplignAlgorithmKind.options;
}

export type SerializerKind = z.infer<typeof schemas.SerializerKind>;

export function getSerializerKindOptions(): SerializerKind[] {
    return schemas.SerializerKind.options;
}

export type BundlingKind = z.infer<typeof schemas.BundlingKind>;

export function getBundlingKindOptions(): BundlingKind[] {
    return schemas.BundlingKind.options;
}
