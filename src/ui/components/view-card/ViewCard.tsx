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
import { pushWarningNotification } from "../../services/NotificationService";
import { Thumbnail } from "../common/thumbnail/Thumbnail";

export interface ViewCardProps {
    metadata: ViewMetadata;
    index: number;
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
    const isNameChanged = currentName !== props.metadata.title;
    const isCameraChanged = !areCameraStatesEqual(
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
        currentBackgroundColor !== props.metadata.backgroundColor;
    const isDirty =
        isNameChanged || isCameraChanged || isBackgroundColorChanged;

    // CSS class builder depends on the active property of view card.
    const viewCardClasses = buildCSSClassString([
        "viewCard",
        "viewCard--active",
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
                    prefix={`${props.index + 1}. view`}
                    value={currentName}
                    placeholder="Change name for this view..."
                    tooltip="Change name for this view..."
                    enabled={true}
                    onValueChange={setCurrentName}
                    onBlur={setCurrentName}
                    bold={true}
                    style={{
                        margin: "1em",
                    }}
                />
            </div>

            {props.metadata.thumbnail && (
                <Thumbnail
                    onClick={() => {
                        if (props.onClick) {
                            props.onClick();
                        }
                    }}
                    title="Click to select this view."
                    src={props.metadata.thumbnail}
                    alt={`${props.metadata.title || `${props.index}. view`} - thumbnail`}
                ></Thumbnail>
            )}

            <CameraTextInputGroup
                cameraState={cameraState}
            ></CameraTextInputGroup>

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
                {isDirty && (
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
                                tooltip="Open View Builder dialogue."
                                label="Builder"
                                variant="secondary"
                                onClick={async () => {}}
                            ></Button>

                            <Button
                                size="small"
                                tooltip="Open View Options dialogue."
                                label="Options"
                                variant="secondary"
                                onClick={async () => {}}
                            ></Button>
                        </div>

                        {/* <div
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
                                            pushWarningNotification(
                                                "Application could not save the canvas screenshot! The current view will contain no screeshot.",
                                            );
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
                                            pushWarningNotification(
                                                "Application could not save the canvas screenshot! The current view will contain no screeshot.",
                                            );
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
                        </div> */}

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
                                tooltip="Revert changes."
                                label="Revert"
                                variant="secondary"
                                onClick={() => {
                                    //     setCurrentName(
                                    //         props.metadata.title || "New view...",
                                    //     );
                                    //     if (props.metadata.backgroundColor) {
                                    //         setCurrentBackgroundColor(
                                    //             props.metadata.backgroundColor,
                                    //         );
                                    //         setBackgroundColor(
                                    //             props.metadata.backgroundColor,
                                    //         );
                                    //     }
                                    //     if (props.metadata.referenceCamera) {
                                    //         setCamera({
                                    //             ...props.metadata.referenceCamera,
                                    //             position: fromMVSPosition(
                                    //                 props.metadata.referenceCamera
                                    //                     .position as any,
                                    //                 props.metadata.referenceCamera
                                    //                     .target as any,
                                    //                 props.metadata.referenceCamera
                                    //                     .fov,
                                    //                 props.metadata.referenceCamera
                                    //                     .mode,
                                    //             ),
                                    //         });
                                    //     }
                                }}
                            ></Button>
                            <Button
                                size="small"
                                label="Copy"
                                tooltip="Create a copy of this view."
                                variant="secondary"
                                onClick={() => {}}
                            ></Button>
                            <Button
                                size="small"
                                label="Save"
                                tooltip="Save this view."
                                variant="primary"
                                onClick={() => {}}
                            ></Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
