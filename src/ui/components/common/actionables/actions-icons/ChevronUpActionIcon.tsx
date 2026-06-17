import { ActionIcon } from "@mantine/core";
import { IconChevronUp } from "@tabler/icons-react";
import { useAppearance } from "../../../../providers/AppearanceProvider";

interface ChevronUpActionIconProps {
    tooltip?: string;
    onClick: () => void;
    enabled?: boolean;
}

export function ChevronUpActionIcon(props: ChevronUpActionIconProps) {
    // Use apperance.
    const { colorScheme } = useAppearance();

    // Choose optimal color based on color scheme.
    const optimalColor =
        colorScheme === "dark" ? "var(--color-light)" : "var(--color-dark)";

    return (
        <ActionIcon
            disabled={props.enabled ?? false}
            variant="subtle"
            color={optimalColor}
            onClick={props.onClick}
            title={props.tooltip}
        >
            <IconChevronUp size={23} />
        </ActionIcon>
    );
}
