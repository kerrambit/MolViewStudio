import { ActionIcon } from "@mantine/core";
import { IconCopy } from "@tabler/icons-react";

interface CopyActionIconProps {
    tooltip?: string;
    onClick: () => void;
}

export function CopyActionIcon(props: CopyActionIconProps) {
    return (
        <ActionIcon
            variant="subtle"
            color="yellow"
            onClick={props.onClick}
            title={props.tooltip}
        >
            <IconCopy size={18} />
        </ActionIcon>
    );
}
