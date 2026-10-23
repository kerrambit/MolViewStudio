/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { ActionIcon, Badge, Button, Divider, Group, Stack, Tooltip } from "@mantine/core";
import {
    IconCamera,
    IconChevronDown,
    IconChevronUp,
    IconCopy,
    IconSettings,
    IconTools,
    IconTrash,
} from "@tabler/icons-react";
import { UnstyledTextInput } from "../../../../../components/common/input/UnstyledTextInput";
import { buildCSSClassString } from "../../../../../utils/cssClassBuilder";
import { Thumbnail } from "../../../../../components/common/thumbnail/Thumbnail";
import { CameraStatus } from "./CameraStatus";
import { CameraTextInputGroup } from "./CameraTextInputGroup";
import type {
    ViewMetadata,
    CameraState,
    Base64Png,
    HexColor,
} from "../../../../../lib/molstar";
import { useViewCard } from "../../../hooks/useViewCard";

import "./ViewCard.css";

export interface ViewCardProps {
    metadata: ViewMetadata;
    index: number;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
    onClick?: () => void;
    onOpenBuilder?: (key: string) => void;
    onOpenOptions?: (key: string) => void;
    onCopy?: () => void;
    onTitleChange?: (title: string | undefined) => void;
    onBackgrounColorChange?: (color: HexColor) => void;
    onCameraSave?: (
        referenceCamera: CameraState,
        thumbnail: Base64Png | undefined,
    ) => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    onDelete?: () => void;
}

export function ViewCard(props: ViewCardProps) {
    // Use view card.
    const {
        currentName,
        cameraState,
        isCameraMoved,
        handleTitleUpdate,
        handleCaptureCamera,
    } = useViewCard(props);

    // CSS class builder depends on the active property of view card.
    const viewCardClasses = buildCSSClassString(["viewCard", "viewCard--active"]);

    // Render the component.
    return (
        <div className={viewCardClasses}>
            {/* Header. */}
            <Group
                justify="space-between"
                wrap="nowrap"
                gap="xs"
                w="100%"
                px="sm"
                pt="xs"
            >
                <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                    <Badge size="sm" variant="light" circle style={{ flexShrink: 0 }}>
                        {props.index + 1}
                    </Badge>
                    <UnstyledTextInput
                        value={currentName}
                        placeholder="Enter title for view"
                        tooltip={currentName}
                        enabled={true}
                        onValueChange={(newName) => {
                            handleTitleUpdate(newName, false);
                        }}
                        onBlur={(newName) => {
                            handleTitleUpdate(newName, true);
                        }}
                        bold={true}
                        style={{ flex: 1, minWidth: 0 }}
                    />
                </Group>

                {/* Header actions. */}
                <Group gap={4} wrap="nowrap">
                    <Tooltip label="Move this view up." withArrow>
                        <ActionIcon
                            variant="subtle"
                            size="sm"
                            disabled={props.canMoveUp === false}
                            onClick={() => props.onMoveUp?.()}
                            aria-label="Move this view up."
                        >
                            <IconChevronUp size={16} stroke={1.75} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Move this view down." withArrow>
                        <ActionIcon
                            variant="subtle"
                            size="sm"
                            disabled={props.canMoveDown === false}
                            onClick={() => props.onMoveDown?.()}
                            aria-label="Move this view down."
                        >
                            <IconChevronDown size={16} stroke={1.75} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Create copy of this view." withArrow>
                        <ActionIcon
                            variant="subtle"
                            size="sm"
                            onClick={() => props.onCopy?.()}
                            aria-label="Create copy of this view."
                        >
                            <IconCopy size={16} stroke={1.75} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Delete this view." withArrow>
                        <ActionIcon
                            variant="subtle"
                            color="red"
                            size="sm"
                            onClick={() => props.onDelete?.()}
                            aria-label="Delete this view."
                        >
                            <IconTrash size={16} stroke={1.75} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Group>

            {/* Thumbnail. */}
            {props.metadata.thumbnail && (
                <Group justify="center" w="100%" px="sm" py="xs">
                    <Thumbnail
                        onClick={() => props.onClick?.()}
                        title="Click to select this view."
                        src={props.metadata.thumbnail}
                        alt={`${
                            props.metadata.title || `${props.index}. view`
                        } - thumbnail`}
                    />
                </Group>
            )}

            {/* Camera position and status. */}
            <Divider w="100%" />
            <Stack gap="xs" w="100%" px="sm" py="xs">
                <CameraStatus
                    doesReferenceCameraExist={
                        props.metadata.referenceCamera !== undefined
                    }
                    isCameraMoved={isCameraMoved}
                />
                <CameraTextInputGroup cameraState={cameraState} />
            </Stack>

            {/* Buttons. */}
            <Divider w="100%" />
            <Stack gap="xs" w="100%" px="sm" py="sm">
                <Button
                    variant="light"
                    size="sm"
                    fullWidth
                    leftSection={<IconCamera size={16} stroke={1.75} />}
                    title="Captures current camera position and saves it."
                    onClick={handleCaptureCamera}
                >
                    Capture camera
                </Button>

                <Group grow gap="xs" wrap="nowrap">
                    <Button
                        variant="default"
                        size="sm"
                        leftSection={<IconTools size={16} stroke={1.75} />}
                        title="Open View Builder sidebar."
                        onClick={() => props.onOpenBuilder?.(props.metadata.key!)}
                    >
                        Builder
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        leftSection={<IconSettings size={16} stroke={1.75} />}
                        title="Open View Options dialogue."
                        onClick={() => props.onOpenOptions?.(props.metadata.key!)}
                    >
                        Options
                    </Button>
                </Group>
            </Stack>
        </div>
    );
}
