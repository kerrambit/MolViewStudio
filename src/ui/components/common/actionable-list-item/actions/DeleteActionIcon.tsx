import { ActionIcon } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";

interface DeleteActionIconProps {
    tooltip?: string;
    onClick: () => void;
}

export function DeleteActionIcon(props: DeleteActionIconProps) {
    return (
        <ActionIcon
            variant="subtle"
            color="red"
            onClick={props.onClick}
            title={props.tooltip}
        >
            <IconTrash size={18} />
        </ActionIcon>
    );
}
