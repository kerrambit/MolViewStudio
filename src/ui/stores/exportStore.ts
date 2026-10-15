/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { create } from "zustand";
import type { ProcessVolumeRequestWithoutFilepaths } from "../config/processingDefinitions";

/**
 * State of an ongoing export. `processing` means the export processing jobs are running
 * and the final download continues automatically once all of them finish.
 */
export type ExportStatus = "idle" | "processing";

type ExportStore = {
    /**
     * Current export status.
     */
    status: ExportStatus;

    /**
     * Processing properties chosen by the user for this export, e.g. the bundling approach
     * which determines the form of the final download.
     */
    properties: ProcessVolumeRequestWithoutFilepaths | undefined;

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
     * Begins a new export with the chosen properties, expecting `expectedJobCount` processing jobs.
     */
    beginExport: (
        properties: ProcessVolumeRequestWithoutFilepaths,
        expectedJobCount: number,
    ) => void;

    /**
     * Registers a started processing job as part of the ongoing export.
     */
    addExportJob: (jobId: ProcessingJobId) => void;

    /**
     * Resets the export back to idle. Called after the export finished, failed or was aborted.
     */
    resetExport: () => void;
};

export const useExportStore = create<ExportStore>((set) => ({
    status: "idle",
    properties: undefined,
    expectedJobCount: 0,
    jobIds: new Set(),

    beginExport: (properties, expectedJobCount) => {
        set({
            status: "processing",
            properties: properties,
            expectedJobCount: expectedJobCount,
            jobIds: new Set(),
        });
    },

    addExportJob: (jobId) => {
        set((state) => ({
            jobIds: new Set(state.jobIds).add(jobId),
        }));
    },

    resetExport: () => {
        set({
            status: "idle",
            properties: undefined,
            expectedJobCount: 0,
            jobIds: new Set(),
        });
    },
}));
