import { ActionIcon } from "@mantine/core";
import { IconPencil } from "@tabler/icons-react";

interface EditActionIconProps {
    tooltip?: string;
    onClick: () => void;
}

export function EditActionIcon(props: EditActionIconProps) {
    return (
        <ActionIcon
            variant="subtle"
            color="gray"
            onClick={props.onClick}
            title={props.tooltip}
        >
            <IconPencil size={18} />
        </ActionIcon>
    );
}
