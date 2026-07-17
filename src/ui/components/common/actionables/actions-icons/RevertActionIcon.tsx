import { ActionIcon } from "@mantine/core";
import { IconArrowBack } from "@tabler/icons-react";
import { useAppearance } from "../../../../hooks/useAppearance";

interface RevertIconProps {
    tooltip?: string;
    onClick: () => void;
    enabled?: boolean;
}

export function RevertActionIcon(props: RevertIconProps) {
    // Use apperance.
    const { colorScheme } = useAppearance();

    // Render the component.
    return (
        <ActionIcon
            disabled={props.enabled ?? false}
            variant="subtle"
            onClick={props.onClick}
            title={props.tooltip}
        >
            <IconArrowBack
                size={23}
                color={colorScheme === "dark" ? "white" : "black"}
            />
        </ActionIcon>
    );
}
