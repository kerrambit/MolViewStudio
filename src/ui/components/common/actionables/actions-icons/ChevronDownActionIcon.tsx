import { ActionIcon } from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";
import { useAppearance } from "../../../../providers/AppearanceProvider";

interface ChevronDownActionIconProps {
    tooltip?: string;
    onClick: () => void;
    enabled?: boolean;
}

export function ChevronDownActionIcon(props: ChevronDownActionIconProps) {
    // Use apperance.
    const { colorScheme } = useAppearance();

    // Choose optimal color based on color scheme.
    const optimalColor =
        colorScheme === "dark" ? "var(--color-light)" : "var(--color-dark)";

    return (
        <ActionIcon
            disabled={props.enabled ?? false}
            variant="subtle"
            onClick={props.onClick}
            color={optimalColor}
            title={props.tooltip}
        >
            <IconChevronDown size={23} />
        </ActionIcon>
    );
}
