import { Button } from "../../../../../components/common/button/Button";
import { UnstyledTextInput } from "../../../../../components/common/input/UnstyledTextInput";
import { buildCSSClassString } from "../../../../../utils/cssClassBuilder";
import { DeleteActionIcon } from "../../../../../components/common/actionables/actions-icons/DeleteActionIcon";
import { ChevronUpActionIcon } from "../../../../../components/common/actionables/actions-icons/ChevronUpActionIcon";
import { ChevronDownActionIcon } from "../../../../../components/common/actionables/actions-icons/ChevronDownActionIcon";
import { RevertActionIcon } from "../../../../../components/common/actionables/actions-icons/RevertActionIcon";
import { CopyActionIcon } from "../../../../../components/common/actionables/actions-icons/CopyActionIcon";
import { ActionableTile } from "../../../../../components/common/actionables/ActionableTile";
import { Thumbnail } from "../../../../../components/common/thumbnail/Thumbnail";
import { pushWarningNotification } from "../../../../../services/NotificationService";
import { CameraStatus } from "./CameraStatus";
import { CameraTextInputGroup } from "./CameraTextInputGroup";
import type {
    ViewMetadata,
    CameraState,
    Base64Png,
    HexColor,
} from "../../../../../lib/molstar";

import "./ViewCard.css";
import { useViewCard } from "../../../hooks/useViewCard";

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
    // Use view card.
    const {
        currentName,
        cameraState,
        isCameraMoved,
        handleTitleUpdate,
        handleCaptureCamera,
    } = useViewCard(props);

    // CSS class builder depends on the active property of view card.
    const viewCardClasses = buildCSSClassString([
        "viewCard",
        "viewCard--active",
    ]);

    // Render the component.
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
                <UnstyledTextInput
                    prefix={`${props.index + 1}. view`}
                    value={currentName}
                    placeholder="Change name for this view."
                    tooltip={currentName}
                    enabled={true}
                    onValueChange={handleTitleUpdate}
                    onBlur={handleTitleUpdate}
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
                        onClick={() => {
                            pushWarningNotification(
                                "Change of order of views is not implemented yet!",
                            );
                        }}
                    />
                    <ChevronUpActionIcon
                        tooltip="Move this view up."
                        onClick={() => {
                            pushWarningNotification(
                                "Change of order of views is not implemented yet!",
                            );
                        }}
                    />
                    <DeleteActionIcon
                        tooltip="Delete this view."
                        onClick={() => props.onDelete?.()}
                    />
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
                        onClick={() => props.onClick?.()}
                        title="Click to select this view."
                        src={props.metadata.thumbnail}
                        alt={`${props.metadata.title || `${props.index}. view`} - thumbnail`}
                    />
                </div>
            )}

            {/* Camera position and status. */}
            <CameraTextInputGroup cameraState={cameraState} />
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
                        onClick={handleCaptureCamera}
                    />

                    {/* Revert action icon. */}
                    <div style={{ display: "flex", gap: "0.5em" }}>
                        <ActionableTile>
                            <RevertActionIcon
                                tooltip="Reverse changes."
                                onClick={() =>
                                    pushWarningNotification(
                                        "Revert of changes is not implemented yet!",
                                    )
                                }
                            />
                        </ActionableTile>

                        {/* Copy action icon. */}
                        <ActionableTile>
                            <CopyActionIcon
                                tooltip="Create copy of this view."
                                onClick={() => props.onCopy?.()}
                            />
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
                        onClick={() =>
                            props.onOpenBuilder?.(props.metadata.key!)
                        }
                    />
                    <Button
                        size="small"
                        tooltip="Open View Options dialogue."
                        label="Options"
                        variant="secondary"
                        onClick={() =>
                            props.onOpenOptions?.(props.metadata.key!)
                        }
                    />
                </div>
            </div>
        </div>
    );
}
