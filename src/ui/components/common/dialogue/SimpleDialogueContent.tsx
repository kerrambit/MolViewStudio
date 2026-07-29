import { Text } from "@mantine/core";
import { Button } from "../button/Button";

interface SimpleDialogueContentProps {
    close: () => void;
    title?: string;
    message?: string;
}

export function SimpleDialogueContent({
    close,
    title,
    message,
}: SimpleDialogueContentProps) {
    return (
        <>
            <Text size="xl" fw={700} mb="xs">
                {title}
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
