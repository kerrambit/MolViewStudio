import { ActionIcon } from "@mantine/core";
import { IconArrowBack } from "@tabler/icons-react";

interface RevertIconProps {
    tooltip?: string;
    onClick: () => void;
    enabled?: boolean;
}

export function RevertActionIcon(props: RevertIconProps) {
    return (
        <ActionIcon
            disabled={props.enabled ?? false}
            variant="subtle"
            color="black"
            onClick={props.onClick}
            title={props.tooltip}
        >
            <IconArrowBack size={23} />
        </ActionIcon>
    );
}
