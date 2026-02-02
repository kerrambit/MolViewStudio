import { useState } from "react";
import {
    getCanvasScreenshot,
    useLiveCameraState,
    type Base64Png,
    type CameraState,
} from "../../../molstar-wrapper/src";
import { UnstyledTextInput } from "../common/input/UnstyledTextInput";
import { Button } from "../common/button/Button";
import { TextInput } from "@mantine/core";

import "./NewViewCardCreator.css";

export interface NewViewCardCreatorProps {
    index: number;
    onSave?: (
        camera: CameraState,
        title: string,
        id: string,
        thumbnail: Base64Png | undefined,
    ) => void;
}

export function NewViewCardCreator(props: NewViewCardCreatorProps) {
    const [currentName, setCurrentName] = useState<string | undefined>(
        "New view...",
    );

    const cameraState = useLiveCameraState();

    return (
        <div className="newViewCardCreator">
            <UnstyledTextInput
                prefix={`${props.index}. `}
                value={currentName ?? "New view..."}
                placeholder="Enter name for new view..."
                tooltip="Enter name for new view..."
                onValueChange={(val) => setCurrentName(val)}
                style={{
                    margin: "1em",
                }}
            />

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
                        cameraState?.position
                            ? `[${cameraState.position[0].toFixed(
                                  1,
                              )}, ${cameraState.position[1].toFixed(
                                  1,
                              )}, ${cameraState.position[2].toFixed(1)}]`
                            : "Not defined"
                    }
                    readOnly
                />

                <TextInput
                    label="Up"
                    value={
                        cameraState?.up
                            ? `[${cameraState.up[0].toFixed(
                                  1,
                              )}, ${cameraState.up[1].toFixed(
                                  1,
                              )}, ${cameraState.up[2].toFixed(1)}]`
                            : "Not defined"
                    }
                    readOnly
                />

                <TextInput
                    label="Target"
                    value={
                        cameraState?.target
                            ? `[${cameraState.target[0].toFixed(
                                  1,
                              )}, ${cameraState.target[1].toFixed(
                                  1,
                              )}, ${cameraState.target[2].toFixed(1)}]`
                            : "Not defined"
                    }
                    readOnly
                />
            </div>

            <div
                style={{
                    display: "flex",
                    paddingBottom: "1em",
                    justifyContent: "center",
                }}
            >
                <Button
                    size="small"
                    tooltip="This view will be saved."
                    label="Save view"
                    variant="secondary"
                    onClick={async () => {
                        if (props.onSave && currentName && cameraState) {
                            let img: Base64Png | undefined;
                            try {
                                img = await getCanvasScreenshot();
                            } catch {
                                img = undefined;
                            }
                            props.onSave(
                                cameraState,
                                currentName,
                                crypto.randomUUID(),
                                img,
                            );
                            setCurrentName("New view...");
                        }
                    }}
                ></Button>
            </div>
        </div>
    );
}
