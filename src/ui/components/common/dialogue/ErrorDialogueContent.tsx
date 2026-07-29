import { Text } from "@mantine/core";
import { Button } from "../button/Button";

interface ErrorDialogueContentProps {
    close: () => void;
    message?: string;
}

export function ErrorDialogueContent({
    close,
    message,
}: ErrorDialogueContentProps) {
    return (
        <>
            <Text size="xl" fw={700} mb="xs">
                Error
            </Text>
            <Text>{message}</Text>

            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "8px",
                    marginTop: "1em",
                }}
            >
                <Button variant={"ghost"} onClick={() => close()}>
                    Ok
                </Button>
            </div>
        </>
    );
}
