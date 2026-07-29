import { create } from "zustand";

export type ProcessingStatus = "running" | "success" | "error";

export type ProcessingJobId = string;

export type ProcessingJob = {
    jobId: ProcessingJobId;
    file: FileData;
    status: ProcessingStatus;
    relativePath: string;
    stages: string[];
    resultPaths?: string[];
    errorMessage?: string;
};

export type ProcessingState = Map<ProcessingJobId, ProcessingJob>;

export type ProcessingStore = {
    jobs: ProcessingState;
    startJob: (
        file: FileData,
        newRelativePath: string,
        jobId: ProcessingJobId,
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
        newRelativePath: string,
    ) => {
        const currentJobs = get().jobs;

        const newMap = new Map(currentJobs);
        newMap.set(jobId, {
            jobId: jobId,
            file,
            relativePath: newRelativePath,
            status: "running",
            stages: [],
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
