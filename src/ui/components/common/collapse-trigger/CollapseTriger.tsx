import { Text, UnstyledButton } from "@mantine/core";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";

type CollapseTriggerProps = {
    title: string;
    expanded: boolean;
    onClick?: () => void;
};

export function CollapseTrigger(props: CollapseTriggerProps) {
    return (
        <UnstyledButton
            onClick={props.onClick}
            style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--mantine-spacing-xs)",
                paddingBottom: "var(--mantine-spacing-sm)",
                cursor: "pointer",
                userSelect: "none",
            }}
        >
            <Text size="lg">{props.title}</Text>
            {props.expanded ? (
                <IconChevronUp size={16} style={{ opacity: 0.7 }} />
            ) : (
                <IconChevronDown size={16} style={{ opacity: 0.7 }} />
            )}
        </UnstyledButton>
    );
}
