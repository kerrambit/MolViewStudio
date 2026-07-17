import { create } from "zustand";

export type ProcessingStatus = "running" | "success" | "error";

export type ProcessingJobId = string;

export type ProcessingJob = {
    jobId: ProcessingJobId;
    file: FileData;
    status: ProcessingStatus;
    progress: number;
    resultPaths?: string[];
    errorMessage?: string;
};

export type ProcessingState = Map<ProcessingJobId, ProcessingJob>;

export type ProcessingStore = {
    jobs: ProcessingState;
    startJob: (file: FileData) => ProcessingJobId;
    updateJobProgress: (jobId: ProcessingJobId, progress: number) => boolean;
    completeJob: (jobId: ProcessingJobId, resultPaths: string[]) => boolean;
    failJob: (jobId: ProcessingJobId, errorMessage: string) => boolean;
    clearJob: (jobId: ProcessingJobId) => boolean;
};

export const useProcessingStore = create<ProcessingStore>((set, get) => ({
    jobs: new Map(),

    startJob: (file: FileData) => {
        const jobId = crypto.randomUUID();
        const currentJobs = get().jobs;

        const newMap = new Map(currentJobs);
        newMap.set(jobId, {
            jobId,
            file,
            status: "running",
            progress: 0,
        });
        set({ jobs: newMap });

        return jobId;
    },

    updateJobProgress: (jobId: ProcessingJobId, progress: number) => {
        const currentJobs = get().jobs;
        const existingJob = currentJobs.get(jobId);

        if (!existingJob) {
            return false;
        }

        const newMap = new Map(currentJobs);
        newMap.set(jobId, {
            ...existingJob,
            progress: progress,
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
            progress: 100,
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
}));
