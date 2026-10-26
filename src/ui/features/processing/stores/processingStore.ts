/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { create } from "zustand";
import type {
    ProcessingJob,
    ProcessingJobId,
    ProcessingJobPurpose,
    ProcessingResultAssetType,
} from "../domain/ProcessingJob";
import { loggerUi } from "../../../services/UiLoggingService";

export type ProcessingState = Map<ProcessingJobId, ProcessingJob>;

export type ProcessingStore = {
    jobs: ProcessingState;
    startJob: (
        file: FileData,
        jobId: ProcessingJobId,
        assetType: ProcessingResultAssetType,
        purpose: ProcessingJobPurpose,
        parentAssetId?: AssetId,
        chooseAssetsFunction?: (assets: FileData[]) => {
            assetIndex: number;
            relativePath: string;
            name: string;
            hidden: boolean;
            kind: ManagedAssetChildKind;
            notify: boolean;
        }[],
    ) => void;
    updateJobStage: (jobId: ProcessingJobId, stage: string) => boolean;
    completeJob: (jobId: ProcessingJobId, resultPaths: string[]) => boolean;
    failJob: (jobId: ProcessingJobId, errorMessage: string) => boolean;
    clearJob: (jobId: ProcessingJobId) => boolean;
    clearAllJobs: () => void;
};

export const useProcessingStore = create<ProcessingStore>((set, get) => ({
    jobs: new Map(),

    startJob: (
        file: FileData,
        jobId: ProcessingJobId,
        assetType: ProcessingResultAssetType,
        purpose: ProcessingJobPurpose,
        parentAssetId?: AssetId,
        chooseAssetsFunction?: (assets: FileData[]) => {
            assetIndex: number;
            relativePath: string;
            name: string;
            hidden: boolean;
            kind: ManagedAssetChildKind;
            notify: boolean;
        }[],
    ) => {
        const currentJobs = get().jobs;

        const newMap = new Map(currentJobs);
        newMap.set(jobId, {
            jobId: jobId,
            file,
            assetType: assetType,
            purpose,
            status: "Running",
            stages: [],
            parentAssetId: parentAssetId,
            chooseAssetsFunction: chooseAssetsFunction,
        });
        set({ jobs: newMap });
    },

    updateJobStage: (jobId: ProcessingJobId, stage: string) => {
        const currentJobs = get().jobs;
        const existingJob = currentJobs.get(jobId);

        if (!existingJob) {
            return false;
        }

        const newMap = new Map(currentJobs);
        newMap.set(jobId, {
            ...existingJob,
            stages: [...existingJob.stages, stage],
        });

        set({ jobs: newMap });

        return true;
    },

    completeJob: (jobId: ProcessingJobId, resultPaths: string[]) => {
        const currentJobs = get().jobs;
        const existingJob = currentJobs.get(jobId);

        if (!existingJob) {
            return false;
        }

        const newMap = new Map(currentJobs);
        newMap.set(jobId, {
            ...existingJob,
            status: "Success",
            resultPaths: resultPaths,
        });

        set({ jobs: newMap });

        return true;
    },

    failJob: (jobId: ProcessingJobId, errorMessage: string) => {
        const currentJobs = get().jobs;
        const existingJob = currentJobs.get(jobId);

        if (!existingJob) {
            return false;
        }

        const newMap = new Map(currentJobs);
        newMap.set(jobId, {
            ...existingJob,
            status: "Error",
            errorMessage: errorMessage,
        });

        set({ jobs: newMap });

        return true;
    },

    clearJob: (jobId: ProcessingJobId) => {
        const currentJobs = get().jobs;
        const job = currentJobs.get(jobId);

        if (!job) {
            return false;
        }

        const newMap = new Map(currentJobs);
        newMap.delete(jobId);
        set({ jobs: newMap });

        return true;
    },

    clearAllJobs: () => {
        set({ jobs: new Map() });
        loggerUi.debug("Processing jobs were cleared.");
    },
}));
