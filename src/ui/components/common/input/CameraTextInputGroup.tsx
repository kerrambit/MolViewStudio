import { TextInput } from "@mantine/core";
import type { CameraState } from "../../../../molstar-wrapper/src";

interface CameraTextInputGroupProps {
    cameraState: CameraState | undefined;
}

export function CameraTextInputGroup(props: CameraTextInputGroupProps) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                width: "95%",
                paddingLeft: "1em",
                gap: ".5em",
            }}
        >
            <TextInput
                label="Camera position"
                value={
                    props.cameraState?.position
                        ? `[${props.cameraState.position[0].toFixed(
                              1,
                          )}, ${props.cameraState.position[1].toFixed(
                              1,
                          )}, ${props.cameraState.position[2].toFixed(1)}]`
                        : "Not defined"
                }
                readOnly
            />

            <TextInput
                label="Up"
                value={
                    props.cameraState?.up
                        ? `[${props.cameraState.up[0].toFixed(
                              1,
                          )}, ${props.cameraState.up[1].toFixed(
                              1,
                          )}, ${props.cameraState.up[2].toFixed(1)}]`
                        : "Not defined"
                }
                readOnly
            />

            <TextInput
                label="Target"
                value={
                    props.cameraState?.target
                        ? `[${props.cameraState.target[0].toFixed(
                              1,
                          )}, ${props.cameraState.target[1].toFixed(
                              1,
                          )}, ${props.cameraState.target[2].toFixed(1)}]`
                        : "Not defined"
                }
                readOnly
            />
        </div>
    );
}
