import { useState } from "react";
import {
    getCanvasScreenshot,
    toMVSPosition,
    useLiveCameraState,
    type Base64Png,
    type CameraState,
} from "../../../molstar-wrapper/src";
import { UnstyledTextInput } from "../common/input/UnstyledTextInput";
import { Button } from "../common/button/Button";
import { CameraTextInputGroup } from "../common/input/CameraTextInputGroup";

import "./NewViewCardCreator.css";

export interface NewViewCardCreatorProps {
    index: number;
    /**
     * Event handler for saving the card.
     * @param id id
     * @param title title
     * @param description description
     * @param descriptionFormat description format
     * @param camera camera which will be saved as `reference camera`, see https://molstar.org/mol-view-spec-docs/camera-settings/
     * @param thumbnail thumbnail
     */
    onSave?: (
        id: string,
        title: string,
        description: string | undefined,
        descriptionFormat: "markdown" | "plaintext" | undefined,
        camera: CameraState,
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

            <CameraTextInputGroup
                cameraState={cameraState}
            ></CameraTextInputGroup>

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
                                // TODO: send notification, log error
                                img = undefined;
                            }
                            props.onSave(
                                crypto.randomUUID(),
                                currentName,
                                undefined,
                                undefined,
                                {
                                    ...cameraState,
                                    position: toMVSPosition({
                                        position: cameraState.position as any,
                                        target: cameraState.target as any,
                                        fov: cameraState.fov,
                                        mode: cameraState.mode,
                                    }),
                                },
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
