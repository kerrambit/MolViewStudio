/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useState } from "react";
import { Collapse, Loader, Text } from "@mantine/core";
import { IconAlertTriangle, IconCheck, IconX } from "@tabler/icons-react";
import { Button } from "../../../../components/common/button/Button";
import { CollapseTrigger } from "../../../../components/common/collapse-trigger/CollapseTriger";
import { useAppearance } from "../../../apperance/hooks/useAppearance";
import { UiLocalStorageService } from "../../../persistence/services/UiLocalStorageService";
import { useDialogueStore } from "../../../dialogue/stores/dialogueStore";
import type { ProcessingJob } from "../../domain/ProcessingJob";
import { useProcessingStore } from "../../stores/processingStore";
import { ProcessingStagesList } from "./ProcessingStagesList";

import "./ProcessingJobCard.css";
import { ErrorDialogueContent } from "../../../dialogue/components/ErrorDialogueContent";
import { SimpleDialogueContent } from "../../../dialogue/components/SimpleDialogueContent";

export type ProcessingJobCardProps = {
    job: ProcessingJob;
};

export function ProcessingJobCard({ job }: ProcessingJobCardProps) {
    // Use processing.
    const clearJob = useProcessingStore((state) => state.clearJob);
    const isJobActive = job.status === "Running";

    // Derived job outcome flags.
    const hasResultFiles = (job.resultPaths?.length ?? 0) > 0;
    const isSuccess = job.status === "Success" && hasResultFiles;
    const isWarning = job.status === "Success" && !hasResultFiles;
    const isError = job.status === "Error";

    const [isStagesListExpanded, setStagesListExpanded] = useState(
        UiLocalStorageService.ProcessingJobs.getJobExpandedState(job.jobId),
    );

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
            {/* Processed filename as title and collapse trigger for stages list below. */}
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                }}
            >
                <Text
                    size="md"
                    fw={700}
                    title={`Purpose of this processing was: "${job.purpose}".`}
                >
                    {job.file.name}
                </Text>
                <CollapseTrigger
                    title={"Stages"}
                    titleTextSize="sm"
                    expanded={isStagesListExpanded}
                    onClick={() => {
                        setStagesListExpanded((prev) => {
                            const nextState = !prev;
                            UiLocalStorageService.ProcessingJobs.setJobExpandedState(
                                job.jobId,
                                nextState,
                            );
                            return nextState;
                        });
                    }}
                ></CollapseTrigger>
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
                <Collapse expanded={isStagesListExpanded}>
                    <ProcessingStagesList
                        stages={job.stages}
                        currentStage={
                            job.stages.length > 0
                                ? job.stages.at(job.stages.length - 1)
                                : undefined
                        }
                        isJobFinished={job.status !== "Running"}
                    />
                </Collapse>

                {/* Running job. */}
                {isJobActive && (
                    <Loader color={colorScheme === "dark" ? "white" : "black"} />
                )}

                {/* Successful job. */}
                {isSuccess && (
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
                                                (path) => `${path.split(/[\\/]/).pop()}`,
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

                {/* Job finished without errors, but produced no files. */}
                {isWarning && (
                    <IconAlertTriangle
                        className="processingJob__icon yellowGlow"
                        title="Show warning details."
                        onClick={async () => {
                            await useDialogueStore.getState().showDialogue({
                                title: `Processing warning of file ${job.file.name}`,
                                width: "600px",
                                showCloseButton: true,
                                content: (close) => (
                                    <SimpleDialogueContent
                                        close={close}
                                        title="No output files"
                                        message={`Processing of "${job.file.name}" finished, but no output files were produced. Please check the input file and the processing settings, then try again.`}
                                    />
                                ),
                            });
                        }}
                        color="gold"
                        size={"3em"}
                    />
                )}

                {/* Failed job. */}
                {isError && (
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
                        variant="ghost"
                        tooltip="Clears the finished job. Cannot be shown again!"
                        onClick={() => clearJob(job.jobId)}
                    >
                        Clear finished job
                    </Button>
                </div>
            )}
        </div>
    );
}
