import { useMemo } from "react";
import { Text } from "@mantine/core";
import { IconArrowDown } from "@tabler/icons-react";
import { useAppearance } from "../../../../hooks/useAppearance";

export type ProcessingStagesListProps = {
    stages: string[];
    currentStage: string | undefined;
    isJobFinished: boolean;
};

export function ProcessingStagesList({
    stages,
    currentStage,
    isJobFinished,
}: ProcessingStagesListProps) {
    // Use appearance.
    const { colorScheme } = useAppearance();

    // Processed stages.
    const processedStages = useMemo(() => {
        const totals: Record<string, number> = {};
        const counts: Record<string, number> = {};

        stages.forEach((stage) => {
            totals[stage] = (totals[stage] || 0) + 1;
        });

        return stages.map((stage, index) => {
            let displayName = stage;

            if (totals[stage] > 1) {
                counts[stage] = (counts[stage] || 0) + 1;
                displayName = `${stage} ${counts[stage]}`;
            }

            return {
                originalName: stage,
                displayName,
                key: `${stage}-${index}`,
                isActive:
                    stage === currentStage || displayName === currentStage,
            };
        });
    }, [stages, currentStage]);

    // Render the component.
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.25em",
            }}
        >
            {processedStages.map((stageObj, index) => (
                <div
                    key={stageObj.key}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                    <div
                        style={{
                            padding: "0.4em 0.8em",
                            borderRadius: "6px",
                            border: "1px solid var(--color-grey-light)",
                            backgroundColor: "transparent",
                        }}
                    >
                        <Text
                            size="sm"
                            fw={stageObj.isActive ? 700 : 400}
                            c={
                                stageObj.isActive
                                    ? colorScheme === "dark"
                                        ? "white"
                                        : "black"
                                    : undefined
                            }
                        >
                            {stageObj.displayName}
                            {stageObj.isActive && !isJobFinished ? "..." : ""}
                        </Text>
                    </div>

                    {index < processedStages.length - 1 && (
                        <IconArrowDown size="1em" style={{ opacity: 0.5 }} />
                    )}
                </div>
            ))}
        </div>
    );
}
