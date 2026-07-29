import { Text } from "@mantine/core";
import { Sidebar } from "../../../../components/common/sidebar/Sidebar";
import { useProcessingStore } from "../../../../stores/processingStore";
import { ProcessingJobCard } from "./ProcessingJobCard";

export function ProcessingJobs() {
    // Use processing.
    const jobs = useProcessingStore((state) => state.jobs);

    // Variables for processing sidebar.
    const jobsList = Array.from(jobs.values());
    const volumeSidebarVisible = jobsList.length > 0;

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
                <Text size="xl" fw={520}>
                    Processing Jobs
                </Text>

                {jobsList.map((job) => (
                    <>
                        <ProcessingJobCard key={job.jobId} job={job} />
                    </>
                ))}
            </Sidebar>
        )
    );
}
