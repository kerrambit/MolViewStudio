import { useMemo } from "react";
import { useProcessingStore } from "../../../stores/processingStore";
import { ProcessingJobSocket } from "../components/processing-manager/ProcessingJobSocket";

export function ProcessingJobSocketsManager() {
    const jobs = useProcessingStore((state) => state.jobs);

    const activeJobIds = useMemo(
        () =>
            Array.from(jobs.values())
                .filter((j) => j.status === "running")
                .map((j) => j.jobId),
        [jobs],
    );

    return (
        <>
            {activeJobIds.map((jobId) => (
                <ProcessingJobSocket key={jobId} jobId={jobId} />
            ))}
        </>
    );
}
