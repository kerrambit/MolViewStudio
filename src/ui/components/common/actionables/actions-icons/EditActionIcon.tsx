import { ActionIcon } from "@mantine/core";
import { IconPencil } from "@tabler/icons-react";
import { useAppearance } from "../../../../providers/AppearanceProvider";

interface EditActionIconProps {
    tooltip?: string;
    onClick: () => void;
}

export function EditActionIcon(props: EditActionIconProps) {
    // Use apperance.
    const { colorScheme } = useAppearance();

    // Choose optimal color based on color scheme.
    const optimalColor =
        colorScheme === "dark" ? "var(--color-light)" : "var(--color-dark)";

    return (
        <ActionIcon
            variant="subtle"
            color={optimalColor}
            onClick={props.onClick}
            title={props.tooltip}
        >
            <IconPencil size={18} />
        </ActionIcon>
    );
}
