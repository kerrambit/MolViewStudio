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
    onClick?: () => void;
    onOpenBuilder?: (key: string) => void;
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
                                tooltip="Open View Builder sidebar."
                                label="Builder"
                                variant="secondary"
                                onClick={async () => {
                                    if (props.onOpenBuilder) {
                                        props.onOpenBuilder(
                                            props.metadata.key!,
                                        );
                                    }
                                }}
                            ></Button>

                            <Button
                                size="small"
                                tooltip="Open View Options sidebar."
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

// function handleOnFork(
//     regime: Regime,
//     setRegime: (regime: Regime) => void,
//     activeViewCardIndex: number,
//     id: string,
//     title: string,
//     description: string | undefined,
//     descriptionFormat: "markdown" | "plaintext" | undefined,
//     referenceCamera: CameraState,
//     thumbnail: Base64Png | undefined,
//     backgroundColor: HexColor | undefined,
// ): void {
//     // Create new view.
//     const newView: ViewMetadata = {
//         id: id,
//         key: id,
//         title: title,
//         description: description,
//         description_format: descriptionFormat,
//         referenceCamera: referenceCamera,
//         backgroundColor: backgroundColor,
//         thumbnail: thumbnail,
//         linger_duration_ms: 5000,
//         transition_duration_ms: undefined,
//     };

//     // Add new snapshot to the Molstar manager.
//     addNewSnapshotToManager(
//         id,
//         title,
//         description,
//         descriptionFormat || "plaintext",
//     );

//     // Update state tree.
//     if (regime.kind === "viewing" && regime.stateTree.kind === "multiple") {
//         // Create copy of current root and apply changes to it.
//         const newNode = applyChangesToNode(
//             regime.stateTree.snapshots[activeViewCardIndex].root,
//             {
//                 referenceCamera: referenceCamera,
//                 thumbnail: thumbnail,
//                 backgroundColor: backgroundColor,
//             },
//         );

//         const newStateTree = addViewIntoStateTree(regime.stateTree, {
//             node: newNode,
//             metadata: {
//                 id: id,
//                 key: id,
//                 title: title,
//                 description: description,
//                 description_format: descriptionFormat,
//                 referenceCamera: referenceCamera,
//                 backgroundColor: backgroundColor,
//                 thumbnail: thumbnail,
//                 linger_duration_ms: 5000,
//                 transition_duration_ms: undefined,
//             },
//         });

//         setRegime({
//             ...regime,
//             stateTree: newStateTree,
//             views: [...regime.views, newView],
//         });
//     }
// }

// function handleOnUpdate(
//     regime: Regime,
//     setRegime: (regime: Regime) => void,
//     activeViewCardIndex: number,
//     id: string,
//     title: string,
//     description: string | undefined,
//     descriptionFormat: "markdown" | "plaintext" | undefined,
//     referenceCamera: CameraState,
//     thumbnail: Base64Png | undefined,
//     backgroundColor: HexColor | undefined,
// ): void {
//     // Update existing snapshot in the Molstar manager by its index.
//     const result = updateSnapshotInManager(
//         activeViewCardIndex,
//         title,
//         description,
//         descriptionFormat || "plaintext",
//     );

//     if (!result.success) {
//         pushErrorNotification(
//             `Internal error occured while updating snapshot in Molstar snapshots' manager: "${result.error.message}"!`,
//         );
//         return;
//     }

//     // Update state tree.
//     if (regime.kind === "viewing" && regime.stateTree.kind === "multiple") {
//         const updatedSnapshots = [...regime.stateTree.snapshots];
//         const snapshotToUpdate = { ...updatedSnapshots[activeViewCardIndex] };

//         snapshotToUpdate.root = applyChangesToNode(snapshotToUpdate.root, {
//             referenceCamera: referenceCamera,
//             thumbnail: thumbnail,
//             backgroundColor: backgroundColor,
//         });

//         snapshotToUpdate.metadata = {
//             ...snapshotToUpdate.metadata,
//             title: title,
//             description: description,
//             description_format: descriptionFormat,
//             linger_duration_ms: 5000,
//             transition_duration_ms: undefined,
//         };

//         updatedSnapshots[activeViewCardIndex] = snapshotToUpdate;

//         setRegime({
//             ...regime,
//             views: regime.views.map((view) =>
//                 view.id === id
//                     ? {
//                           ...view,
//                           title,
//                           description,
//                           description_format: descriptionFormat,
//                           referenceCamera,
//                           thumbnail,
//                           backgroundColor,
//                           linger_duration_ms: 5000,
//                           transition_duration_ms: undefined,
//                       }
//                     : view,
//             ),
//             stateTree: {
//                 ...regime.stateTree,
//                 snapshots: updatedSnapshots,
//             },
//         });
//     }
// }
