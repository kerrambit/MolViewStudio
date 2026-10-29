/**
 * Copyright (c) 2026-now GeomCanva contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { Group, Paper, Text } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import type { CSSProperties } from "react";

export type InfoMessageProps = {
    text: string;
    textSize?: "sm" | "xs" | "md" | "lg" | "xl";
    iconSize?: number;
    style?: CSSProperties;
};

export function InfoMessage({
    text,
    textSize = "sm",
    iconSize = 20,
    style,
}: InfoMessageProps) {
    return (
        <Paper
            withBorder
            p="sm"
            style={{
                ...style,
                backgroundColor: "rgba(59, 130, 246, 0.15)",
                borderColor: "rgba(59, 130, 246, 0.8)",
            }}
        >
            <Group gap="sm" wrap="nowrap" align="flex-start">
                <IconInfoCircle size={iconSize} color="rgb(59, 130, 246)" />
                <Text size={textSize}>{text}</Text>
            </Group>
        </Paper>
    );
}
