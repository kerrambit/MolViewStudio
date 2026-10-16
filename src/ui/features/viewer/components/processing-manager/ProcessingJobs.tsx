/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useEffect, useRef } from "react";
import { Divider, Text } from "@mantine/core";
import { Sidebar } from "../../../../components/common/sidebar/Sidebar";
import { useProcessingStore } from "../../../../stores/processingStore";
import { useWindowsStore } from "../../stores/WindowsStore";
import { ProcessingJobCard } from "./ProcessingJobCard";
import { CloseActionIcon } from "../../../../components/common/actionables/actions-icons/CloseActionIcon";

export function ProcessingJobs() {
    // Use processing.
    const jobs = useProcessingStore((state) => state.jobs);

    // Use windows.
    const isWindowOpened = useWindowsStore((state) =>
        state.isWindowOpened("processing-jobs"),
    );
    const openWindow = useWindowsStore((state) => state.openWindow);
    const closeWindow = useWindowsStore((state) => state.closeWindow);

    // Variables for processing sidebar.
    const jobsList = Array.from(jobs.values());

    // Auto open the window once the first job arrives.
    const hadJobs = useRef(jobsList.length > 0);
    useEffect(() => {
        const hasJobs = jobsList.length > 0;
        if (hasJobs && !hadJobs.current) {
            openWindow("processing-jobs");
        }
        hadJobs.current = hasJobs;
    }, [jobsList.length, openWindow]);

    // Render the component.
    return (
        isWindowOpened && (
            <Sidebar
                style={{
                    gap: ".5em",
                    padding: ".5em",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Text size="xl" fw={520}>
                        Processing Jobs
                    </Text>
                    <CloseActionIcon
                        onClick={() => closeWindow("processing-jobs")}
                        tooltip="Close Processing sidebar."
                    />
                </div>

                <Divider style={{ paddingBottom: "1em" }} />

                {jobsList.map((job) => (
                    <ProcessingJobCard key={job.jobId} job={job} />
                ))}
                {jobsList.length === 0 && (
                    <Text size="sm" c="dimmed" ta="center">
                        No jobs found...
                    </Text>
                )}
            </Sidebar>
        )
    );
}
