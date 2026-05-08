import { useEffect, useState } from "react";
import { Button } from "../common/button/Button";
import { UnstyledTextInput } from "../common/input/UnstyledTextInput";
import { buildCSSClassString } from "../../utils/cssClassBuilder";
import { CameraTextInputGroup } from "../common/input/CameraTextInputGroup";
import { Color } from "molstar/lib/mol-util/color";
import { Thumbnail } from "../common/thumbnail/Thumbnail";
import {
    areCameraStatesEqual,
    getBackgroundColorChangeSubscription,
    getCanvasScreenshot,
    toMVSPosition,
    useLiveCameraState,
    type Base64Png,
    type CameraState,
    type HexColor,
    type ViewMetadata,
} from "../../../molstar-wrapper/src";
import { pushWarningNotification } from "../../services/NotificationService";

import "./ViewCard.css";
import { CameraStatus } from "./CameraStatus";

export interface ViewCardProps {
    metadata: ViewMetadata;
    index: number;
    onClick?: () => void;
    onOpenBuilder?: (key: string) => void;
    onOpenOptions?: (key: string) => void;
    onCopy?: () => void;
    onTitleChange?: (title: string | undefined) => void;
    onBackgrounColorChange?: (color: HexColor) => void;
    onCameraSave?: (
        referenceCamera: CameraState,
        thumbnail: Base64Png | undefined,
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

    // Propagate async change of color to the parent.
    useEffect(() => {
        if (
            props.onBackgrounColorChange &&
            currentBackgroundColor &&
            currentBackgroundColor !== props.metadata.backgroundColor
        ) {
            props.onBackgrounColorChange(currentBackgroundColor);
        }
    }, [
        currentBackgroundColor,
        props.onBackgrounColorChange,
        props.metadata.backgroundColor,
    ]);

    // Camera hook.
    const cameraState = useLiveCameraState();

    // Function to check if the camera has moved with respect to initial camera position.
    const hasCameraMoved = () => {
        if (!cameraState || !props.metadata.referenceCamera) {
            return false;
        }

        const liveCameraReferenced = {
            ...cameraState,
            position: toMVSPosition({
                position: cameraState.position as any,
                target: cameraState.target as any,
                fov: cameraState.fov,
                mode: cameraState.mode,
            }),
        };

        return !areCameraStatesEqual(
            props.metadata.referenceCamera,
            liveCameraReferenced,
        );
    };

    // Boolean variable storing information if the camera has moved with respect to initial camera position.
    const isCameraMoved = hasCameraMoved();

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
                    placeholder="Change name for this view."
                    tooltip={currentName}
                    enabled={true}
                    onValueChange={(newName) => {
                        setCurrentName(newName);
                        if (props.onTitleChange) {
                            props.onTitleChange(newName);
                        }
                    }}
                    onBlur={(newName) => {
                        setCurrentName(newName);
                        if (props.onTitleChange) {
                            props.onTitleChange(newName);
                        }
                    }}
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

            <CameraStatus
                doesReferenceCameraExist={
                    props.metadata.referenceCamera !== undefined
                }
                isCameraMoved={isCameraMoved}
            />

            <div
                style={{
                    marginTop: "0.75em",
                    paddingLeft: "5em",
                    paddingRight: "5em",
                    display: "flex",
                    justifyContent: "center",
                    flexDirection: "column",
                }}
            >
                <Button
                    label="Capture camera"
                    tooltip="Captures current camera position and saves it. If capturing of screenshot is enabled in Options, screenshot is created, too."
                    size="small"
                    onClick={async () => {
                        if (props.onCameraSave && cameraState) {
                            let img: Base64Png | undefined;
                            try {
                                img = await getCanvasScreenshot();
                            } catch {
                                pushWarningNotification(
                                    "Application could not save the canvas screenshot! The current view will contain no screeshot.",
                                );
                                img = undefined;
                            }

                            props.onCameraSave(
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
                        }
                    }}
                />
            </div>

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
                            tooltip="Open View Builder sidebar."
                            label="Builder"
                            variant="secondary"
                            onClick={async () => {
                                if (props.onOpenBuilder) {
                                    props.onOpenBuilder(props.metadata.key!);
                                }
                            }}
                        ></Button>

                        <Button
                            size="small"
                            tooltip="Open View Options dialogue."
                            label="Options"
                            variant="secondary"
                            onClick={async () => {
                                if (props.onOpenOptions) {
                                    props.onOpenOptions(props.metadata.key!);
                                }
                            }}
                        ></Button>
                    </div>

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
                                pushWarningNotification(
                                    `Revert of changes is not implemented yet!`,
                                );
                            }}
                        ></Button>
                        <Button
                            size="small"
                            label="Copy"
                            tooltip="Create a copy of this view."
                            variant="secondary"
                            onClick={props.onCopy}
                        ></Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
