import { ActionIcon } from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";

interface ChevronDownActionIconProps {
    tooltip?: string;
    onClick: () => void;
    enabled?: boolean;
}

export function ChevronDownActionIcon(props: ChevronDownActionIconProps) {
    return (
        <ActionIcon
            disabled={props.enabled ?? false}
            variant="subtle"
            color="black"
            onClick={props.onClick}
            title={props.tooltip}
        >
            <IconChevronDown size={23} />
        </ActionIcon>
    );
}
