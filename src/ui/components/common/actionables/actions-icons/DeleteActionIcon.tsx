import { ActionIcon } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";

interface DeleteActionIconProps {
    tooltip?: string;
    enabled?: boolean;
    onClick: () => void;
}

export function DeleteActionIcon(props: DeleteActionIconProps) {
    return (
        <ActionIcon
            disabled={props.enabled ?? false}
            variant="subtle"
            color="red"
            onClick={props.onClick}
            title={props.tooltip}
        >
            <IconTrash
                size={18}
                color={props.enabled === true ? "grey" : "red"}
            />
        </ActionIcon>
    );
}
