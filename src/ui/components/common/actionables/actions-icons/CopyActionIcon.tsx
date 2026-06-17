import { ActionIcon } from "@mantine/core";
import { IconCopy } from "@tabler/icons-react";
import { useAppearance } from "../../../../providers/AppearanceProvider";

interface CopyActionIconProps {
    tooltip?: string;
    onClick: () => void;
}

export function CopyActionIcon(props: CopyActionIconProps) {
    const { colorScheme } = useAppearance();
    const optimalYellow = colorScheme === "dark" ? "#facc15" : "#c27803";

    return (
        <ActionIcon
            variant="subtle"
            onClick={props.onClick}
            title={props.tooltip}
            color={
                colorScheme === "dark"
                    ? "var(--color-light)"
                    : "var(--color-dark)"
            }
        >
            <IconCopy size={18} color={optimalYellow} />
        </ActionIcon>
    );
}
