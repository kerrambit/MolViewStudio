/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import type { ReactNode } from "react";
import { Text, UnstyledButton } from "@mantine/core";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";

type CollapseTriggerProps = {
    title: string;
    titleTextSize?: "lg" | "xs" | "sm" | "md" | "xl";
    expanded: boolean;
    onClick?: () => void;
    icon?: ReactNode;
};

export function CollapseTrigger(props: CollapseTriggerProps) {
    return (
        <UnstyledButton
            onClick={props.onClick}
            aria-expanded={props.expanded}
            style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--mantine-spacing-xs)",
                cursor: "pointer",
                userSelect: "none",
            }}
        >
            {props.icon && (
                <span style={{ display: "flex", alignItems: "center", opacity: 0.8 }}>
                    {props.icon}
                </span>
            )}
            <Text size={props.titleTextSize}>{props.title}</Text>
            {props.expanded ? (
                <IconChevronUp size={16} style={{ opacity: 0.7 }} />
            ) : (
                <IconChevronDown size={16} style={{ opacity: 0.7 }} />
            )}
        </UnstyledButton>
    );
}
