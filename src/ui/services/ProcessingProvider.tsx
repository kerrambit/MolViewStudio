import {
    createContext,
    useState,
    useCallback,
    type ReactNode,
    useContext,
} from "react";

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

export type ProcessingState = Record<ProcessingJobId, ProcessingJob>;

export type ProcessingContextType = {
    jobs: ProcessingState;
    startJob: (file: FileData) => ProcessingJobId;
    updateJobProgress: (jobId: ProcessingJobId, progress: number) => void;
    completeJob: (jobId: ProcessingJobId, resultPaths: string[]) => void;
    failJob: (jobId: ProcessingJobId, errorMessage: string) => void;
    clearJob: (jobId: ProcessingJobId) => void;
};

export const ProcessingContext = createContext<
    ProcessingContextType | undefined
>(undefined);

export function useProcessing() {
    const context = useContext(ProcessingContext);
    if (!context) {
        throw new Error("Processing must be used within a ProcessingProvider!");
    }
    return context;
}

export function ProcessingProvider({ children }: { children: ReactNode }) {
    const [jobs, setJobs] = useState<ProcessingState>({});

    const startJob = useCallback((file: FileData) => {
        const jobId = crypto.randomUUID();

        setJobs((prev) => ({
            ...prev,
            [jobId]: {
                jobId,
                file,
                status: "running",
                progress: 0,
            },
        }));

        return jobId;
    }, []);

    const updateJobProgress = useCallback((jobId: string, progress: number) => {
        setJobs((prev) => {
            if (!prev[jobId]) return prev;
            return {
                ...prev,
                [jobId]: { ...prev[jobId], progress },
            };
        });
    }, []);

    const completeJob = useCallback((jobId: string, resultPaths: string[]) => {
        setJobs((prev) => {
            if (!prev[jobId]) return prev;
            return {
                ...prev,
                [jobId]: {
                    ...prev[jobId],
                    status: "success",
                    progress: 100,
                    resultPaths,
                },
            };
        });
    }, []);

    const failJob = useCallback((jobId: string, errorMessage: string) => {
        setJobs((prev) => {
            if (!prev[jobId]) return prev;
            return {
                ...prev,
                [jobId]: {
                    ...prev[jobId],
                    status: "error",
                    errorMessage,
                },
            };
        });
    }, []);

    const clearJob = useCallback((jobId: string) => {
        setJobs((prev) => {
            const newJobs = { ...prev };
            delete newJobs[jobId];
            return newJobs;
        });
    }, []);

    return (
        <ProcessingContext.Provider
            value={{
                jobs,
                startJob,
                updateJobProgress,
                completeJob,
                failJob,
                clearJob,
            }}
        >
            {children}
        </ProcessingContext.Provider>
    );
}
