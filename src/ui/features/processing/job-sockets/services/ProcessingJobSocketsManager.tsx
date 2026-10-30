/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useMemo } from "react";
import { useProcessingStore } from "../../stores/processingStore";
import { ProcessingJobSocket } from "../componets/ProcessingJobSocket";

export function ProcessingJobSocketsManager() {
    const jobs = useProcessingStore((state) => state.jobs);

    const activeJobIds = useMemo(
        () =>
            Array.from(jobs.values())
                .filter((j) => j.status === "Running")
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
