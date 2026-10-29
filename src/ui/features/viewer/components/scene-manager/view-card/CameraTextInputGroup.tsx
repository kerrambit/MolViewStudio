/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { ActionIcon, TextInput } from "@mantine/core";
import { IconCopy } from "@tabler/icons-react";
import type { CameraState } from "../../../../../lib/molstar";
import {
    pushInfoNotification,
    pushWarningNotification,
} from "../../../../notifications/services/NotificationService";

interface CameraTextInputGroupProps {
    cameraState: CameraState | undefined;
}

export function CameraTextInputGroup(props: CameraTextInputGroupProps) {
    // Define strings for camera state.
    const formatVec3 = (vec: readonly number[] | undefined) =>
        vec
            ? `[${vec[0].toFixed(1)}, ${vec[1].toFixed(1)}, ${vec[2].toFixed(1)}]`
            : "Not defined";

    const cameraFields = [
        {
            label: "Position",
            tooltip: "Camera position. Cannot edit this value!",
            value: formatVec3(props.cameraState?.position),
        },
        {
            label: "Up",
            tooltip: "Camera up vector. Cannot edit this value!",
            value: formatVec3(props.cameraState?.up),
        },
        {
            label: "Target",
            tooltip: "Camera target. Cannot edit this value!",
            value: formatVec3(props.cameraState?.target),
        },
    ];

    // Render the component.
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                gap: "0.25em",
            }}
        >
            {cameraFields.map((field) => (
                <TextInput
                    key={field.label}
                    size="xs"
                    label={field.label}
                    value={field.value}
                    onChange={() => {}}
                    title={field.tooltip}
                    variant="filled"
                    rightSection={
                        <ActionIcon
                            variant="transparent"
                            size="xs"
                            aria-label={`Copy camera ${field.label.toLowerCase()}.`}
                            title={`Copy camera ${field.label.toLowerCase()}.`}
                            onClick={async () => {
                                try {
                                    await navigator.clipboard.writeText(field.value);
                                    pushInfoNotification(
                                        `Camera ${field.label.toLowerCase()} was copied.`,
                                    );
                                } catch (err) {
                                    pushWarningNotification(
                                        `Failed to copy camera ${field.label.toLowerCase()}! Details: "${err}".`,
                                    );
                                }
                            }}
                        >
                            <IconCopy size={14} stroke={1.75} />
                        </ActionIcon>
                    }
                    style={{
                        width: "100%",
                    }}
                />
            ))}
        </div>
    );
}
