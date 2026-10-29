/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { Group, Text } from "@mantine/core";

interface CameraStatusProps {
    doesReferenceCameraExist: boolean;
    isCameraMoved: boolean;
}

export function CameraStatus(props: CameraStatusProps) {
    let statusText = "No camera saved.";
    let statusColor = "var(--mantine-color-gray-5)";

    if (props.doesReferenceCameraExist) {
        if (props.isCameraMoved) {
            statusText = "Camera has moved.";
            statusColor = "var(--mantine-color-orange-5)";
        } else {
            statusText = "Camera saved.";
            statusColor = "var(--mantine-color-green-6)";
        }
    }

    // Render the component.
    return (
        <Group
            gap="xs"
            wrap="nowrap"
            title={statusText}
            style={{ justifyContent: "center" }}
        >
            <div
                style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: statusColor,
                    flexShrink: 0,
                }}
            />
            <Text size="xs" c="dimmed">
                {statusText}
            </Text>
        </Group>
    );
}
