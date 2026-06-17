import { TextInput } from "@mantine/core";
import { CopyActionIcon } from "../../../components/common/actionables/actions-icons/CopyActionIcon";
import {
    pushInfoNotification,
    pushWarningNotification,
} from "../../../services/NotificationService";
import type { CameraState } from "../../../lib/molstar";

interface CameraTextInputGroupProps {
    cameraState: CameraState | undefined;
}

export function CameraTextInputGroup(props: CameraTextInputGroupProps) {
    // Define strings for camera state.
    const cameraPositionString = props.cameraState?.position
        ? `[${props.cameraState.position[0].toFixed(1)}, ${props.cameraState.position[1].toFixed(1)}, ${props.cameraState.position[2].toFixed(1)}]`
        : "Not defined";

    const cameraUpString = props.cameraState?.position
        ? `[${props.cameraState.up[0].toFixed(1)}, ${props.cameraState.up[1].toFixed(1)}, ${props.cameraState.up[2].toFixed(1)}]`
        : "Not defined";

    const cameraTargetString = props.cameraState?.position
        ? `[${props.cameraState.target[0].toFixed(1)}, ${props.cameraState.target[1].toFixed(1)}, ${props.cameraState.target[2].toFixed(1)}]`
        : "Not defined";

    // Render the component.
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                width: "95%",
                paddingLeft: "0.5em",
                paddingRight: "0.5em",
                gap: "0.15em",
            }}
        >
            <TextInput
                label="Camera position"
                value={cameraPositionString}
                title="Camera position. Cannot edit this value!"
                variant="filled"
                rightSection={
                    <CopyActionIcon
                        tooltip="Copy camera position."
                        onClick={async () => {
                            try {
                                await navigator.clipboard.writeText(
                                    cameraPositionString,
                                );
                                pushInfoNotification(
                                    `Camera position was copied.`,
                                );
                            } catch (err) {
                                pushWarningNotification(
                                    `Failed to copy camera position! Details: "${err}".`,
                                );
                            }
                        }}
                    />
                }
                style={{
                    width: "100%",
                }}
            />

            <TextInput
                label="Up"
                value={cameraUpString}
                title="Camera up vector. Cannot edit this value!"
                variant="filled"
                rightSection={
                    <CopyActionIcon
                        tooltip="Copy camera up vector."
                        onClick={async () => {
                            try {
                                await navigator.clipboard.writeText(
                                    cameraUpString,
                                );
                                pushInfoNotification(
                                    `Camera up vector was copied.`,
                                );
                            } catch (err) {
                                pushWarningNotification(
                                    `Failed to copy camera up vector! Details: :${err}".`,
                                );
                            }
                        }}
                    />
                }
                style={{
                    width: "100%",
                }}
            />

            <TextInput
                label="Target"
                value={cameraTargetString}
                title="Camera target. Cannot edit this value!"
                variant="filled"
                rightSection={
                    <CopyActionIcon
                        tooltip="Copy camera target."
                        onClick={async () => {
                            try {
                                await navigator.clipboard.writeText(
                                    cameraTargetString,
                                );
                                pushInfoNotification(
                                    `Camera target was copied.`,
                                );
                            } catch (err) {
                                pushWarningNotification(
                                    `Failed to copy camera target! Details: "${err}".`,
                                );
                            }
                        }}
                    />
                }
                style={{
                    width: "100%",
                }}
            />
        </div>
    );
}
