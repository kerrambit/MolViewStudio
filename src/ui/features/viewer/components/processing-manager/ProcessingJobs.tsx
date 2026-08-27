import { useState } from "react";
import { Divider, Text } from "@mantine/core";
import { Sidebar } from "../../../../components/common/sidebar/Sidebar";
import { useProcessingStore } from "../../../../stores/processingStore";
import { ProcessingJobCard } from "./ProcessingJobCard";
import { CloseActionIcon } from "../../../../components/common/actionables/actions-icons/CloseActionIcon";

export function ProcessingJobs() {
    // Use processing.
    const jobs = useProcessingStore((state) => state.jobs);

    // Variables for processing sidebar.
    const jobsList = Array.from(jobs.values());

    // Local "closed by user" state.
    const [closed, setClosed] = useState(false);

    // Track the previous set of job ids as state, compared during render.
    const [prevJobIdsKey, setPrevJobIdsKey] = useState("");
    const currentJobIdsKey = jobsList.map((job) => job.jobId).join(",");

    if (currentJobIdsKey !== prevJobIdsKey) {
        const prevIds = new Set(prevJobIdsKey ? prevJobIdsKey.split(",") : []);
        const hasNewJob = jobsList.some((job) => !prevIds.has(job.jobId));

        setPrevJobIdsKey(currentJobIdsKey);
        if (hasNewJob) {
            setClosed(false);
        }
    }

    // Should we render the sidebar?
    const volumeSidebarVisible = jobsList.length > 0 && !closed;

    // Render the component.
    return (
        volumeSidebarVisible && (
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
                        onClick={() => setClosed(true)}
                        tooltip="Close Processing sidebar."
                    />
                </div>

                <Divider style={{ paddingBottom: "1em" }} />

                {jobsList.map((job) => (
                    <ProcessingJobCard key={job.jobId} job={job} />
                ))}
            </Sidebar>
        )
    );
}
