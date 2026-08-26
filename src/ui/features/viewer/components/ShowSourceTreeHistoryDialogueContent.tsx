import { useMemo } from "react";
import { Text } from "@mantine/core";
import { useRegimeStore } from "../../../stores/regimeStore";
import { Button } from "../../../components/common/button/Button";

interface ShowSourceTreeHistoryDialogueContentProps {
    close: () => void;
}

export function ShowSourceTreeHistoryDialogueContent({
    close,
}: ShowSourceTreeHistoryDialogueContentProps) {
    // Use regime.
    const regime = useRegimeStore((state) => state.regime);

    // History.
    const history = useMemo(() => {
        if (regime.kind === "viewing" || regime.kind === "restoring") {
            return regime.history;
        }
        return null;
    }, [regime]);

    // Render the component.
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "1em",
            }}
        >
            {history?.getTimeline().map(({ node, isActive }, index) => {
                const time = new Date(node.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                });

                const label = `#${index}: ${node.description} at ${node.viewIndex}. index (${time})`;

                return (
                    <Text
                        key={node.timestamp}
                        fw={isActive ? "bold" : "normal"}
                        color={isActive ? "blue" : "dimmed"}
                    >
                        {isActive ? `[${label}]` : label}
                    </Text>
                );
            })}

            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                }}
            >
                <Button
                    variant="secondary"
                    size="small"
                    tooltip="Closes the dialogue window."
                    label="OK"
                    onClick={close}
                />
            </div>
        </div>
    );
}
