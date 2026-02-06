import { useState } from "react";
import { Button } from "../common/button/Button";
import { UnstyledTextInput } from "../common/input/UnstyledTextInput";
import { buildCSSClassString } from "../../utils/cssClassBuilder";
import { CameraTextInputGroup } from "../common/input/CameraTextInputGroup";
import {
    getCanvasScreenshot,
    toMVSPosition,
    useLiveCameraState,
    type Base64Png,
    type CameraState,
} from "../../../molstar-wrapper/src";

import "./ViewCard.css";

export interface ViewCardProps {
    title: string;
    active: boolean;
    index: number;
    thumbnail?: string;
    onClick?: () => void;
    onSave?: (
        id: string,
        title: string,
        description: string | undefined,
        descriptionFormat: "markdown" | "plaintext" | undefined,
        camera: CameraState,
        thumbnail: Base64Png | undefined,
    ) => void;
    onFork?: (
        id: string,
        title: string,
        description: string | undefined,
        descriptionFormat: "markdown" | "plaintext" | undefined,
        camera: CameraState,
        thumbnail: Base64Png | undefined,
    ) => void;
}

export function ViewCard(props: ViewCardProps) {
    const [currentName, setCurrentName] = useState<string | undefined>(
        props.title,
    );

    const cameraState = useLiveCameraState();

    const viewCardClasses = buildCSSClassString([
        "viewCard",
        props.active && "viewCard--active",
    ]);

    return (
        <div className={viewCardClasses}>
            <div
                style={{
                    width: "100%",
                }}
            >
                <UnstyledTextInput
                    prefix={`${props.index + 1}. `}
                    defaultValue={props.title}
                    placeholder="Change name for this view..."
                    tooltip="Change name for this view..."
                    onBlur={(val) => {
                        setCurrentName(val);
                    }}
                    style={{
                        margin: "1em",
                    }}
                />
            </div>

            {props.thumbnail && (
                <img
                    onClick={() => {
                        if (props.onClick) {
                            props.onClick();
                        }
                    }}
                    style={{
                        cursor: "pointer",
                        maxWidth: "90%",
                        borderRadius: "6px",
                    }}
                    title="Click to set the current camera position to this view."
                    src={props.thumbnail}
                    alt={`${props.title} - thumbnail`}
                />
            )}

            {props.active && (
                <CameraTextInputGroup
                    cameraState={cameraState}
                ></CameraTextInputGroup>
            )}
            <div
                style={{
                    display: "flex",
                    paddingTop: "1em",
                    paddingBottom: "1em",
                    flexDirection: "column",
                }}
            >
                {!props.active && (
                    <Button
                        size="small"
                        tooltip="The current camera position will be set to this view."
                        label="Load view"
                        variant="secondary"
                        onClick={() => {
                            if (props.onClick) {
                                props.onClick();
                            }
                        }}
                    ></Button>
                )}

                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                    }}
                >
                    {props.active && (
                        <Button
                            size="small"
                            tooltip="Apply changes to this view."
                            label="Apply changes"
                            variant="secondary"
                            onClick={async () => {
                                if (
                                    props.onSave &&
                                    currentName &&
                                    cameraState
                                ) {
                                    let img: Base64Png | undefined;
                                    try {
                                        img = await getCanvasScreenshot();
                                    } catch {
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
                                                position:
                                                    cameraState.position as any,
                                                target: cameraState.target as any,
                                                fov: cameraState.fov,
                                                mode: cameraState.mode,
                                            }),
                                        },
                                        img,
                                    );
                                }
                            }}
                        ></Button>
                    )}
                    {props.active && (
                        <Button
                            size="small"
                            tooltip="Create a new state from current modifications."
                            label="Save as new"
                            variant="secondary"
                            onClick={async () => {
                                if (
                                    props.onFork &&
                                    currentName &&
                                    cameraState
                                ) {
                                    let img: Base64Png | undefined;
                                    try {
                                        img = await getCanvasScreenshot();
                                    } catch {
                                        img = undefined;
                                    }
                                    props.onFork(
                                        crypto.randomUUID(),
                                        currentName,
                                        undefined,
                                        undefined,
                                        {
                                            ...cameraState,
                                            position: toMVSPosition({
                                                position:
                                                    cameraState.position as any,
                                                target: cameraState.target as any,
                                                fov: cameraState.fov,
                                                mode: cameraState.mode,
                                            }),
                                        },
                                        img,
                                    );
                                }
                            }}
                        ></Button>
                    )}
                </div>
            </div>
        </div>
    );
}
