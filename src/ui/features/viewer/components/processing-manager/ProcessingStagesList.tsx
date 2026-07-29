import { Text } from "@mantine/core";
import { IconArrowDown } from "@tabler/icons-react";
import { useAppearance } from "../../../../hooks/useAppearance";

export type ProcessingStagesListProps = {
    stages: string[];
    currentStage?: string;
};

export function ProcessingStagesList({
    stages,
    currentStage,
}: ProcessingStagesListProps) {
    // Use apperance.
    const { colorScheme } = useAppearance();

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
            {stages.map((stage, index) => (
                <div
                    key={stage}
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
                            fw={stage === currentStage ? 700 : 400}
                            c={
                                stage === currentStage
                                    ? colorScheme === "dark"
                                        ? "white"
                                        : "black"
                                    : undefined
                            }
                        >
                            {stage}
                        </Text>
                    </div>

                    {index < stages.length - 1 && (
                        <IconArrowDown size="1em" style={{ opacity: 0.5 }} />
                    )}
                </div>
            ))}
        </div>
    );
}
