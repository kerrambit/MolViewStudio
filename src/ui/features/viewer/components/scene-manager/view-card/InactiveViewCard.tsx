/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { Badge, Button, Divider, Group, Stack } from "@mantine/core";
import { UnstyledTextInput } from "../../../../../components/common/input/UnstyledTextInput";
import { Thumbnail } from "../../../../../components/common/thumbnail/Thumbnail";
import { IconClick } from "@tabler/icons-react";

import "./ViewCard.css";

export interface InactiveViewCardProps {
    title?: string;
    thumbnail?: Base64URLString;
    index: number;
    onClick?: () => void;
}

export function InactiveViewCard(props: InactiveViewCardProps) {
    // Render the component.
    return (
        <div className={"viewCard"}>
            <Group justify="space-between" gap="xs" w="100%" px="sm" pt="xs" pb="xs">
                <Group
                    gap="xs"
                    style={{
                        flex: 1,
                        width: "100%",
                    }}
                    wrap="nowrap"
                >
                    <Badge size="md" variant="default" circle style={{ flexShrink: 0 }}>
                        {props.index + 1}
                    </Badge>

                    <UnstyledTextInput
                        defaultValue={props.title}
                        placeholder={props.title}
                        tooltip={props.title}
                        enabled={false}
                        bold={true}
                        style={{ flex: 1 }}
                    />
                </Group>
                <Divider w="100%" />
            </Group>

            {props.thumbnail && (
                <Group justify="center" w="100%" px="sm" py="xs">
                    <Thumbnail
                        onClick={() => props.onClick?.()}
                        title="Click to select this view."
                        src={props.thumbnail}
                        alt={`${props.title || `${props.index}. view`} - thumbnail`}
                    />
                    <Divider w="100%" />
                </Group>
            )}

            <Stack gap="xs" w="100%" px="sm" py="sm">
                <Button
                    variant="default"
                    size="sm"
                    fullWidth
                    leftSection={<IconClick size={16} stroke={1.75} />}
                    title="Select this view."
                    onClick={() => {
                        if (props.onClick) {
                            props.onClick();
                        }
                    }}
                >
                    Select view
                </Button>
            </Stack>
        </div>
    );
}
