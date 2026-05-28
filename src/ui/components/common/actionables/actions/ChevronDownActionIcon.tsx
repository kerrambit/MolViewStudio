import { ActionIcon } from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";
import { useAppearance } from "../../../../services/AppearanceProvider";

interface ChevronDownActionIconProps {
    tooltip?: string;
    onClick: () => void;
    enabled?: boolean;
}

export function ChevronDownActionIcon(props: ChevronDownActionIconProps) {
    const { colorScheme } = useAppearance();

    return (
        <ActionIcon
            disabled={props.enabled ?? false}
            variant="subtle"
            onClick={props.onClick}
            title={props.tooltip}
        >
            <IconChevronDown
                size={23}
                color={colorScheme === "dark" ? "white" : "black"}
            />
        </ActionIcon>
    );
}
