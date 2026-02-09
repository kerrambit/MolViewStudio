import { useEffect, useState } from "react";
import { Button } from "../common/button/Button";
import { UnstyledTextInput } from "../common/input/UnstyledTextInput";
import { buildCSSClassString } from "../../utils/cssClassBuilder";
import { CameraTextInputGroup } from "../common/input/CameraTextInputGroup";
import { Color } from "molstar/lib/mol-util/color";
import {
    areCameraStatesEqual,
    fromMVSPosition,
    getBackgroundColorChangeSubscription,
    getCanvasScreenshot,
    setBackgroundColor,
    setCamera,
    toMVSPosition,
    useLiveCameraState,
    type Base64Png,
    type CameraState,
    type HexColor,
    type ViewMetadata,
} from "../../../molstar-wrapper/src";

import "./ViewCard.css";

export interface ViewCardProps {
    metadata: ViewMetadata;
    index: number;
    active: boolean;
    onClick?: () => void;
    onSave?: (
        title: string,
        description: string | undefined,
        descriptionFormat: "markdown" | "plaintext" | undefined,
        referenceCamera: CameraState,
        thumbnail: Base64Png | undefined,
        backgroundColor: HexColor | undefined,
    ) => void;
    onFork?: (
        id: string,
        title: string,
        description: string | undefined,
        descriptionFormat: "markdown" | "plaintext" | undefined,
        referenceCamera: CameraState,
        thumbnail: Base64Png | undefined,
        backgroundColor: HexColor | undefined,
    ) => void;
}

export function ViewCard(props: ViewCardProps) {
    // State for the view title.
    const [currentName, setCurrentName] = useState<string | undefined>(
        props.metadata.title || "New view...",
    );

    // State for the view background color.
    const [currentBackgroundColor, setCurrentBackgroundColor] = useState<
        HexColor | undefined
    >(props.metadata.backgroundColor);

    // Subscribe to the change of background color.
    useEffect(() => {
        const sub = getBackgroundColorChangeSubscription((color) => {
            if (color) {
                const hex = Color.toHexStyle(color);
                setCurrentBackgroundColor((prev) =>
                    prev === hex ? prev : hex,
                );
            }
        });

        return () => {
            if (sub) sub.unsubscribe();
        };
    }, []);

    // Camera hook.
    const cameraState = useLiveCameraState();

    // Dirty properties of the view card.
    const isNameChanged = props.active && currentName !== props.metadata.title;
    const isCameraChanged =
        props.active &&
        !areCameraStatesEqual(
            cameraState
                ? {
                      position: toMVSPosition({
                          position: cameraState.position as any,
                          target: cameraState.target as any,
                          fov: cameraState.fov,
                          mode: cameraState.mode,
                      }),
                      target: cameraState.target,
                      up: cameraState.up,
                      fov: cameraState.fov,
                      mode: cameraState.mode,
                  }
                : cameraState,
            props.metadata.referenceCamera,
        );
    const isBackgroundColorChanged =
        props.active &&
        currentBackgroundColor !== props.metadata.backgroundColor;
    const isDirty =
        isNameChanged || isCameraChanged || isBackgroundColorChanged;

    // CSS class builder depends on the active property of view card.
    const viewCardClasses = buildCSSClassString([
        "viewCard",
        props.active && "viewCard--active",
    ]);

    // Render compoment.
    return (
        <div className={viewCardClasses}>
            <div
                style={{
                    width: "100%",
                }}
            >
                <UnstyledTextInput
                    prefix={`${props.index + 1}. `}
                    value={currentName}
                    placeholder="Change name for this view..."
                    tooltip="Change name for this view..."
                    enabled={props.active}
                    onValueChange={setCurrentName}
                    onBlur={setCurrentName}
                    style={{
                        margin: "1em",
                    }}
                />
            </div>

            {props.metadata.thumbnail && (
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
                        paddingBottom: "1em",
                    }}
                    title="Click to set the current camera position to this view."
                    src={props.metadata.thumbnail}
                    alt={`${props.metadata.title || "New view..."} - thumbnail`}
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
                    paddingRight: "1em",
                    paddingLeft: "1em",
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

                {props.active && isDirty && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            gap: "1em",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "center",
                                gap: "1em",
                            }}
                        >
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
                                            // TODO: send notification, log error
                                            img = undefined;
                                        }

                                        props.onSave(
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
                                            currentBackgroundColor,
                                        );
                                    }
                                }}
                            ></Button>

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
                                            // TODO: send notification, log error
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
                                            currentBackgroundColor,
                                        );
                                    }
                                }}
                            ></Button>
                        </div>

                        <Button
                            size="small"
                            tooltip="Reverse changes for this view."
                            variant="primary"
                            onClick={() => {
                                setCurrentName(
                                    props.metadata.title || "New view...",
                                );
                                if (props.metadata.backgroundColor) {
                                    setCurrentBackgroundColor(
                                        props.metadata.backgroundColor,
                                    );
                                    setBackgroundColor(
                                        props.metadata.backgroundColor,
                                    );
                                }
                                if (props.metadata.referenceCamera) {
                                    setCamera({
                                        ...props.metadata.referenceCamera,
                                        position: fromMVSPosition(
                                            props.metadata.referenceCamera
                                                .position as any,
                                            props.metadata.referenceCamera
                                                .target as any,
                                            props.metadata.referenceCamera.fov,
                                            props.metadata.referenceCamera.mode,
                                        ),
                                    });
                                }
                            }}
                        >
                            Revert changes
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
