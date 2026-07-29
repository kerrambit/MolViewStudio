import { Loader, Text } from "@mantine/core";
import { Button } from "../../../../components/common/button/Button";
import {
    useProcessingStore,
    type ProcessingJob,
} from "../../../../stores/processingStore";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useDialogueStore } from "../../../../stores/dialogueStore";
import { ErrorDialogueContent } from "../../../../components/common/dialogue/ErrorDialogueContent";
import { useAppearance } from "../../../../hooks/useAppearance";
import { SimpleDialogueContent } from "../../../../components/common/dialogue/SimpleDialogueContent";

import "./ProcessingJobCard.css";
import { ProcessingStagesList } from "./ProcessingStagesList";

export type ProcessingJobCardProps = {
    job: ProcessingJob;
};

export function ProcessingJobCard({ job }: ProcessingJobCardProps) {
    // Use processing.
    const clearJob = useProcessingStore((state) => state.clearJob);
    const isJobActive = job.status === "running";

    // Use apperance.
    const { colorScheme } = useAppearance();

    // Render the component.
    return (
        <div
            className="processingJob"
            style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: "1em",
                borderRadius: "6px",
                marginBottom: "0.5em",
            }}
        >
            {/* Processed filename as title. */}
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "start",
                }}
            >
                <Text size="md" fw={700}>
                    {job.file.name}
                </Text>
            </div>

            {/* Main body of the card. */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: "1em",
                    marginTop: "1em",
                    gap: "1em",
                }}
            >
                {/* Stages. */}
                <ProcessingStagesList
                    stages={job.stages}
                    currentStage={
                        job.stages.length > 0
                            ? job.stages.at(job.stages.length - 1)
                            : undefined
                    }
                    isJobFinished={job.status !== "running"}
                />

                {/* Running job. */}
                {job.status === "running" && (
                    <Loader
                        color={colorScheme === "dark" ? "white" : "black"}
                    />
                )}

                {/* Successful job. */}
                {job.status === "success" && (
                    <IconCheck
                        className="processingJob__icon greenGlow"
                        title="Show processed files."
                        onClick={async () => {
                            await useDialogueStore.getState().showDialogue({
                                title: `Processed files of file ${job.file.name}`,
                                width: "600px",
                                showCloseButton: true,
                                content: (close) => (
                                    <SimpleDialogueContent
                                        close={close}
                                        title="Processed files"
                                        message={job.resultPaths
                                            ?.map(
                                                (path) =>
                                                    `${job.relativePath}${path
                                                        .split(/[\\/]/)
                                                        .pop()}`,
                                            )
                                            .join(", ")}
                                    />
                                ),
                            });
                        }}
                        color="green"
                        size={"3em"}
                    />
                )}

                {/* Failed job. */}
                {job.status === "error" && (
                    <IconX
                        className="processingJob__icon redGlow"
                        title="Show error details."
                        onClick={async () => {
                            await useDialogueStore.getState().showDialogue({
                                title: `Processing error of file ${job.file.name}`,
                                width: "800px",
                                showCloseButton: true,
                                content: (close) => (
                                    <ErrorDialogueContent
                                        close={close}
                                        message={job.errorMessage}
                                    />
                                ),
                            });
                        }}
                        color="red"
                        size={"3em"}
                    />
                )}
            </div>

            {/* Button to clear the job. */}
            {!isJobActive && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        width: "50%",
                    }}
                >
                    <Button
                        size="small"
                        variant="secondary"
                        tooltip="Clears the finsihed job. Cannot be shown again!"
                        onClick={() => clearJob(job.jobId)}
                    >
                        Clear finished job
                    </Button>
                </div>
            )}
        </div>
    );
}
