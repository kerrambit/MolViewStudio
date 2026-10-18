/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { create } from "zustand";
import type { ResolutionLevel } from "../../../processing/resolution/domain/ResolutionLevel";
import type { ProcessVolumeRequestWithoutFilepaths } from "../../../processing/volume/api/ProcessVolumeRequest";
import type { ProcessingJobId } from "../../../processing/domain/ProcessingJob";

/**
 * State of an ongoing export. `processing` means the export processing jobs are running
 * and the final export continues automatically once all of them finish.
 */
export type ExportStatus = "idle" | "processing";

type ExportStore = {
    /**
     * Current export status.
     */
    status: ExportStatus;

    /**
     * Processing properties chosen by the user for this export, e.g. the bundling approach
     * which determines the form of the final export.
     */
    properties: ProcessVolumeRequestWithoutFilepaths | undefined;

    /**
     * Folder where the final export output is saved.
     */
    outputPath: string | undefined;

    filename: string;

    /**
     * Resolution level of the processed volume embedded into the story export.
     */
    targetResolution: ResolutionLevel | undefined;

    /**
     * Number of processing jobs the export expects. The export can only continue
     * once all of them were started and finished.
     */
    expectedJobCount: number;

    /**
     * IDs of processing jobs which belong to this export.
     */
    jobIds: Set<ProcessingJobId>;

    /**
     * Mapping of export processing job ID to the managed asset it processes.
     */
    jobIdAssetIds: Map<ProcessingJobId, AssetId>;

    /**
     * Begins a new export with the chosen properties, expecting `expectedJobCount` processing jobs.
     */
    beginExport: (
        properties: ProcessVolumeRequestWithoutFilepaths,
        outputPath: string,
        filename: string,
        targetResolution: ResolutionLevel,
        expectedJobCount: number,
    ) => void;

    /**
     * Registers a started processing job as part of the ongoing export.
     */
    addExportJob: (jobId: ProcessingJobId, assetId: AssetId) => void;

    /**
     * Resets the export back to idle. Called after the export finished, failed or was aborted.
     */
    resetExport: () => void;
};

export const useExportStore = create<ExportStore>((set) => ({
    status: "idle",
    properties: undefined,
    outputPath: undefined,
    filename: "export",
    targetResolution: undefined,
    expectedJobCount: 0,
    jobIds: new Set(),
    jobIdAssetIds: new Map(),

    beginExport: (
        properties,
        outputPath,
        filename,
        targetResolution,
        expectedJobCount,
    ) => {
        set({
            status: "processing",
            properties: properties,
            outputPath: outputPath,
            filename: filename,
            targetResolution: targetResolution,
            expectedJobCount: expectedJobCount,
            jobIds: new Set(),
            jobIdAssetIds: new Map(),
        });
    },

    addExportJob: (jobId, assetId) => {
        set((state) => ({
            jobIds: new Set(state.jobIds).add(jobId),
            jobIdAssetIds: new Map(state.jobIdAssetIds).set(jobId, assetId),
        }));
    },

    resetExport: () => {
        set({
            status: "idle",
            properties: undefined,
            outputPath: undefined,
            targetResolution: undefined,
            expectedJobCount: 0,
            jobIds: new Set(),
            jobIdAssetIds: new Map(),
        });
    },
}));
