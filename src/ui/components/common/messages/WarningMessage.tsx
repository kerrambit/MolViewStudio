/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { Group, Paper, Text } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import type { CSSProperties } from "react";

export type WarningMessageProps = {
    text: string;
    textSize?: "sm" | "xs" | "md" | "lg" | "xl";
    style?: CSSProperties;
};

export function WarningMessage({ text, textSize = "sm", style }: WarningMessageProps) {
    return (
        <Paper
            withBorder
            p="sm"
            style={{
                ...style,
                backgroundColor: "rgba(251, 191, 36, 0.25)",
                borderColor: "rgba(251, 191, 36, 0.8)",
            }}
        >
            <Group gap="sm" wrap="nowrap" align="flex-start">
                <IconAlertTriangle size={20} />
                <Text size={textSize}>{text}</Text>
            </Group>
        </Paper>
    );
}
