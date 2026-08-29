/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { ActionIcon } from "@mantine/core";
import { IconCopy } from "@tabler/icons-react";
import { useAppearance } from "../../../../hooks/useAppearance";
import { computeOptimalYellow } from "./utils/computeOptimalYellow";

interface CopyActionIconProps {
    tooltip?: string;
    onClick: () => void;
}

export function CopyActionIcon(props: CopyActionIconProps) {
    const { colorScheme } = useAppearance();
    const optimalYellow = computeOptimalYellow(colorScheme);

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
