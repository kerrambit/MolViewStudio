import { Text } from "@mantine/core";
import { Sidebar } from "../../../../components/common/sidebar/Sidebar";
import { Button } from "../../../../components/common/button/Button";
import { useProcessingStore } from "../../../../stores/processingStore";

export function ProcessingJobs() {
    // Use processing.
    const jobs = useProcessingStore((state) => state.jobs);
    const clearJob = useProcessingStore((state) => state.clearJob);

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
                    <div
                        key={job.jobId}
                        style={{
                            border: "1px solid var(--color-grey-light)",
                            padding: "0.5em",
                            borderRadius: "6px",
                            marginBottom: "0.5em",
                        }}
                    >
                        <strong>
                            {job.file?.name || "Processing File..."}
                        </strong>

                        <div
                            style={{
                                margin: "5px 0",
                                fontSize: "0.9em",
                            }}
                        >
                            {job.status === "running" &&
                                `Processing... ${job.stage}%`}

                            {job.status === "success" && (
                                <span style={{ color: "green" }}>
                                    Finished!
                                </span>
                            )}

                            {job.status === "error" && (
                                <span style={{ color: "red" }}>
                                    Error: {job.errorMessage}
                                </span>
                            )}
                        </div>

                        <Button
                            size="small"
                            onClick={() => clearJob(job.jobId)}
                        >
                            {job.status === "running" ? "Hide Job" : "Close"}
                        </Button>
                    </div>
                ))}
            </Sidebar>
        )
    );
}
