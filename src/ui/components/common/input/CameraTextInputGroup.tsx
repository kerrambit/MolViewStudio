import type { CameraState } from "../../../../molstar-wrapper/src";
import { UnstyledTextInput } from "./UnstyledTextInput";
import { CopyActionIcon } from "../actionable-list-item/actions/CopyActionIcon";
import {
    pushInfoNotification,
    pushWarningNotification,
} from "../../../services/NotificationService";

interface CameraTextInputGroupProps {
    cameraState: CameraState | undefined;
}

export function CameraTextInputGroup(props: CameraTextInputGroupProps) {
    const cameraPositionString = props.cameraState?.position
        ? `[${props.cameraState.position[0].toFixed(1)}, ${props.cameraState.position[1].toFixed(1)}, ${props.cameraState.position[2].toFixed(1)}]`
        : "Not defined";

    const cameraUpString = props.cameraState?.position
        ? `[${props.cameraState.up[0].toFixed(1)}, ${props.cameraState.up[1].toFixed(1)}, ${props.cameraState.up[2].toFixed(1)}]`
        : "Not defined";

    const cameraTargetString = props.cameraState?.position
        ? `[${props.cameraState.target[0].toFixed(1)}, ${props.cameraState.target[1].toFixed(1)}, ${props.cameraState.target[2].toFixed(1)}]`
        : "Not defined";

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
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <UnstyledTextInput
                    prefix="Camera position"
                    value={cameraPositionString}
                    style={{
                        width: "90%",
                    }}
                />
                <CopyActionIcon
                    tooltip="Copy camera position."
                    onClick={async () => {
                        try {
                            await navigator.clipboard.writeText(
                                cameraPositionString,
                            );
                            pushInfoNotification(`Camera position was copied.`);
                        } catch (err) {
                            pushWarningNotification(
                                `Failed to copy camera position! Details: "${err}".`,
                            );
                        }
                    }}
                />
            </div>

            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <UnstyledTextInput
                    prefix="Up"
                    value={cameraUpString}
                    style={{
                        width: "90%",
                    }}
                />
                <CopyActionIcon
                    tooltip="Copy camera up vector."
                    onClick={async () => {
                        try {
                            await navigator.clipboard.writeText(cameraUpString);
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
            </div>

            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <UnstyledTextInput
                    prefix="Target"
                    value={cameraTargetString}
                    style={{
                        width: "90%",
                    }}
                />
                <CopyActionIcon
                    tooltip="Copy camera target."
                    onClick={async () => {
                        try {
                            await navigator.clipboard.writeText(
                                cameraTargetString,
                            );
                            pushInfoNotification(`Camera target was copied.`);
                        } catch (err) {
                            pushWarningNotification(
                                `Failed to copy camera target! Details: "${err}".`,
                            );
                        }
                    }}
                />
            </div>
        </div>
    );
}
