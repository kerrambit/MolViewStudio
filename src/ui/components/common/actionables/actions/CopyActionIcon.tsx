import { ActionIcon, useMantineColorScheme } from "@mantine/core";
import { IconCopy } from "@tabler/icons-react";

interface CopyActionIconProps {
    tooltip?: string;
    onClick: () => void;
}

export function CopyActionIcon(props: CopyActionIconProps) {
    const { colorScheme } = useMantineColorScheme();
    const optimalYellow = colorScheme === "dark" ? "#facc15" : "#c27803";

    return (
        <ActionIcon
            variant="subtle"
            onClick={props.onClick}
            title={props.tooltip}
        >
            <IconCopy size={18} color={optimalYellow} />
        </ActionIcon>
    );
}
