/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { ActionIcon } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { useAppearance } from "../../../../hooks/useAppearance";

interface CloseActionIconProps {
    tooltip?: string;
    onClick: () => void;
}

export function CloseActionIcon(props: CloseActionIconProps) {
    // Use apperance.
    const { colorScheme } = useAppearance();

    // Choose optimal color based on color scheme.
    const optimalColor =
        colorScheme === "dark" ? "var(--color-light)" : "var(--color-dark)";

    // Render.
    return (
        <ActionIcon
            variant="subtle"
            onClick={props.onClick}
            color={optimalColor}
            title={props.tooltip}
        >
            <IconX size={18} />
        </ActionIcon>
    );
}
