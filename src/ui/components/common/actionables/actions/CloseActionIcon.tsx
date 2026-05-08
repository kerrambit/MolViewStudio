import { ActionIcon } from "@mantine/core";
import { IconX } from "@tabler/icons-react";

interface CloseActionIconProps {
    tooltip?: string;
    onClick: () => void;
}

export function CloseActionIcon(props: CloseActionIconProps) {
    return (
        <ActionIcon
            variant="subtle"
            color="black"
            onClick={props.onClick}
            title={props.tooltip}
        >
            <IconX size={18} />
        </ActionIcon>
    );
}
