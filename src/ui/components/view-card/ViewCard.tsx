import { useEffect, useState } from "react";
import { Button } from "../common/button/Button";
import { UnstyledTextInput } from "../common/input/UnstyledTextInput";
import { buildCSSClassString } from "../../utils/cssClassBuilder";
import { CameraTextInputGroup } from "../../features/viewer/components/CameraTextInputGroup";
import { DeleteActionIcon } from "../common/actionables/actions-icons/DeleteActionIcon";
import { ChevronUpActionIcon } from "../common/actionables/actions-icons/ChevronUpActionIcon";
import { ChevronDownActionIcon } from "../common/actionables/actions-icons/ChevronDownActionIcon";
import { RevertActionIcon } from "../common/actionables/actions-icons/RevertActionIcon";
import { CopyActionIcon } from "../common/actionables/actions-icons/CopyActionIcon";
import { ActionableTile } from "../common/actionables/ActionableTile";
import { Thumbnail } from "../common/thumbnail/Thumbnail";
import { pushWarningNotification } from "../../services/NotificationService";
import { CameraStatus } from "./CameraStatus";
import { Color } from "molstar/lib/mol-util/color";
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
} from "../../lib/molstar";

import "./ViewCard.css";

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
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    onDelete?: () => void;
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
        <div className={viewCardClasses} style={{ gap: "0.5em" }}>
            {/* Header. */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.5em 1em",
                    borderBottom: "1px solid var(--color-grey-light)",
                }}
            >
                {/* Title of the view. */}
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
                />

                {/* Header actions. */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3em",
                    }}
                >
                    <ChevronDownActionIcon
                        tooltip="Move this view down."
                        onClick={() => {}}
                    ></ChevronDownActionIcon>

                    <ChevronUpActionIcon
                        tooltip="Move this view up."
                        onClick={() => {}}
                    ></ChevronUpActionIcon>

                    <DeleteActionIcon
                        tooltip="Delete this view."
                        onClick={() => {
                            if (props.onDelete) props.onDelete();
                        }}
                    ></DeleteActionIcon>
                </div>
            </div>

            {/* Thumbnail. */}
            {props.metadata.thumbnail && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        paddingBottom: "1em",
                        paddingTop: "1em",
                    }}
                >
                    <Thumbnail
                        onClick={() => {
                            if (props.onClick) props.onClick();
                        }}
                        title="Click to select this view."
                        src={props.metadata.thumbnail}
                        alt={`${props.metadata.title || `${props.index}. view`} - thumbnail`}
                    />
                </div>
            )}

            {/* Camera position. */}
            <CameraTextInputGroup cameraState={cameraState} />

            {/* Camera status. */}
            <CameraStatus
                doesReferenceCameraExist={
                    props.metadata.referenceCamera !== undefined
                }
                isCameraMoved={isCameraMoved}
            />

            {/* Buttons. */}
            <div
                style={{
                    paddingBottom: "1em",
                    paddingTop: "1em",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5em",
                    width: "90%",
                }}
            >
                {/* Primary button & utility action icons. */}
                <div
                    style={{
                        display: "flex",
                        gap: "0.5em",
                        alignItems: "stretch",
                        justifyContent: "center",
                    }}
                >
                    <Button
                        label="Capture camera"
                        tooltip="Captures current camera position and saves it."
                        size="small"
                        variant="secondary"
                        onClick={async () => {
                            if (props.onCameraSave && cameraState) {
                                // Retrieve canvas screenshot.
                                let img: Base64Png | undefined;
                                try {
                                    img = await getCanvasScreenshot();
                                } catch {
                                    pushWarningNotification(
                                        "Application could not save the canvas screenshot! The current view will contain no screenshot.",
                                    );
                                    img = undefined;
                                }

                                props.onCameraSave(
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
                    />

                    {/* Revert action icon. */}
                    <div style={{ display: "flex", gap: "0.5em" }}>
                        <ActionableTile>
                            <RevertActionIcon
                                tooltip="Reverse changes."
                                onClick={() => {
                                    pushWarningNotification(
                                        `Revert of changes is not implemented yet!`,
                                    );
                                }}
                            ></RevertActionIcon>
                        </ActionableTile>

                        {/* Copy action icon. */}
                        <ActionableTile>
                            <CopyActionIcon
                                tooltip="Create copy of this view."
                                onClick={() => {
                                    if (props.onCopy) props.onCopy();
                                }}
                            ></CopyActionIcon>
                        </ActionableTile>
                    </div>
                </div>

                {/* Secondary buttons. */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "0.5em",
                    }}
                >
                    {/* View Builder button. */}
                    <Button
                        size="small"
                        tooltip="Open View Builder sidebar."
                        label="Builder"
                        variant="secondary"
                        onClick={() => {
                            if (props.onOpenBuilder) {
                                props.onOpenBuilder(props.metadata.key!);
                            }
                        }}
                    />

                    {/* View Options button. */}
                    <Button
                        size="small"
                        tooltip="Open View Options dialogue."
                        label="Options"
                        variant="secondary"
                        onClick={() => {
                            if (props.onOpenOptions) {
                                props.onOpenOptions(props.metadata.key!);
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
