import { ActionIcon } from "@mantine/core";
import { IconChevronUp } from "@tabler/icons-react";
import { useAppearance } from "../../../../services/AppearanceProvider";

interface ChevronUpActionIconProps {
    tooltip?: string;
    onClick: () => void;
    enabled?: boolean;
}

export function ChevronUpActionIcon(props: ChevronUpActionIconProps) {
    const { colorScheme } = useAppearance();

    return (
        <ActionIcon
            disabled={props.enabled ?? false}
            variant="subtle"
            onClick={props.onClick}
            title={props.tooltip}
        >
            <IconChevronUp
                size={23}
                color={colorScheme === "dark" ? "white" : "black"}
            />
        </ActionIcon>
    );
}
