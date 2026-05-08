import { ActionIcon } from "@mantine/core";
import { IconChevronUp } from "@tabler/icons-react";

interface ChevronUpActionIconProps {
    tooltip?: string;
    onClick: () => void;
    enabled?: boolean;
}

export function ChevronUpActionIcon(props: ChevronUpActionIconProps) {
    return (
        <ActionIcon
            disabled={props.enabled ?? false}
            variant="subtle"
            color="black"
            onClick={props.onClick}
            title={props.tooltip}
        >
            <IconChevronUp size={23} />
        </ActionIcon>
    );
}
