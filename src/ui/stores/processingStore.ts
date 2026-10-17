/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { create } from "zustand";

export type ProcessingStatus = "running" | "success" | "error";

/**
 * Purpose of the job. `asset` jobs add processed files as new managed assets when finished (default).
 * `export` jobs are part of an export: processed files are used for the exported archive instead.
 */
export type ProcessingJobPurpose = "asset" | "export";

export type ProcessingJob = {
    jobId: ProcessingJobId;
    file: FileData;
    status: ProcessingStatus;
    /**
     * Type of asset for processing. Processed assets inherit this asset type, see `ManagedAssetType`.
     */
    assetType: "Volume" | "Segmentation";
    stages: string[];
    resultPaths?: string[];
    errorMessage?: string;

    /**
     * ID of the parent managed asset this job was started for, e.g. when doing preview downsampling. Undefined for standalone jobs.
     */
    parentAssetId?: AssetId;

    purpose?: ProcessingJobPurpose;

    /**
     * This callback is used when the job finished succefully.
     * It expects processed assets and should return array of information about chosen assets from the processing.
     */
    chooseAssetsFunction?: (assets: FileData[]) => {
        assetIndex: number;
        relativePath: string;
        name: string;
        hidden: boolean;
        kind: ManagedAssetChildKind;
        notify: boolean;
    }[];
};

export type ProcessingState = Map<ProcessingJobId, ProcessingJob>;

export type ProcessingStore = {
    jobs: ProcessingState;
    startJob: (
        file: FileData,
        jobId: ProcessingJobId,
        assetType: "Volume" | "Segmentation",
        parentAssetId?: AssetId,
        purpose?: "asset" | "export",
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
        assetType: "Volume" | "Segmentation",
        parentAssetId?: AssetId,
        purpose?: "asset" | "export",
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
            status: "running",
            stages: [],
            parentAssetId: parentAssetId,
            chooseAssetsFunction: chooseAssetsFunction,
            purpose: purpose ?? "asset",
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
            status: "success",
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
            status: "error",
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
    },
}));
