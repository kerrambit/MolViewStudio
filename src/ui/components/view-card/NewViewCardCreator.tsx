import { useState } from "react";
import {
    getCanvasImageAsUri,
    useLiveCameraState,
    type Base64Png,
} from "../../../molstar-wrapper/src";
import { UnstyledTextInput } from "../common/input/UnstyledTextInput";
import { Button } from "../common/button/Button";
import { Vec3 } from "molstar/lib/mol-math/linear-algebra/3d";
import { TextInput } from "@mantine/core";

import "./NewViewCardCreator.css";

export interface NewViewCardCreatorProps {
    index: number;
    onSave?: (
        position: Vec3 | undefined,
        up: Vec3 | undefined,
        target: Vec3 | undefined,
        title: string,
        id: string,
        thumbnail: Base64Png | undefined
    ) => void;
}

export function NewViewCardCreator(props: NewViewCardCreatorProps) {
    const [currentName, setCurrentName] = useState<string | undefined>(
        "Enter name for new view..."
    );

    const cameraState = useLiveCameraState();

    return (
        <div className="newViewCardCreator">
            <UnstyledTextInput
                prefix={`${props.index}. `}
                defaultValue="Enter name for new view..."
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
                                  1
                              )}, ${cameraState.position[1].toFixed(
                                  1
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
                                  1
                              )}, ${cameraState.up[1].toFixed(
                                  1
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
                                  1
                              )}, ${cameraState.target[1].toFixed(
                                  1
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
                        let img: Base64Png | undefined;
                        try {
                            img = await getCanvasImageAsUri();
                        } catch {
                            img = undefined;
                        }

                        if (props.onSave && currentName && cameraState) {
                            props.onSave(
                                cameraState.position,
                                cameraState.up,
                                cameraState.target,
                                currentName,
                                crypto.randomUUID(),
                                img
                            );
                        }
                    }}
                ></Button>
            </div>
        </div>
    );
}
