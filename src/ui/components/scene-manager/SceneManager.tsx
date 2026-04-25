import { useState } from "react";
import { SegmentedController } from "../common/segmented-controller/SegmentedController";
import { Sidebar } from "../common/sidebar/Sidebar";
import { useRegime } from "../../services/RegimeProvider";
import { StoryOptions } from "./story-options/StoryOptions";
import { Assets } from "./assets-sidebar/Assets";
import { Views } from "./views-sidebar/Views";

interface SceneManagerProps {
    isMolstarExpanded: boolean;
    isMolstarLoading: boolean;
}

export function SceneManager(props: SceneManagerProps) {
    // Sidebar state.
    type SidebarType = "storyOptions" | "assets" | "views";
    const [sidebar, setSidebar] = useState<SidebarType>("storyOptions");

    // Regime.
    const { regime, setRegime } = useRegime();

    // Render component.
    return (
        <Sidebar
            style={{
                gap: ".5em",
                padding: ".5em",
            }}
        >
            {/* Fix: segmented controller was visible in Molstar Full-Screen, that is why we can if molstar is expanded. */}
            {!props.isMolstarExpanded && (
                <SegmentedController<SidebarType>
                    value={sidebar}
                    onChange={setSidebar}
                    data={[
                        { label: "Story Options", value: "storyOptions" },
                        { label: "Assets", value: "assets" },
                        { label: "Views", value: "views" },
                    ]}
                    widthWrapOrientationLimit={292}
                />
            )}

            {sidebar === "storyOptions" && regime.kind === "viewing" && (
                <StoryOptions
                    title={regime.stateTree.metadata.title}
                    onTitleChange={(newTitle) => {
                        setRegime({
                            ...regime,
                            stateTree: {
                                ...regime.stateTree,
                                metadata: {
                                    ...regime.stateTree.metadata,
                                    title: newTitle,
                                },
                            },
                        });
                    }}
                    description={regime.stateTree.metadata.description}
                    onDescriptionChange={(newDescription) => {
                        setRegime({
                            ...regime,
                            stateTree: {
                                ...regime.stateTree,
                                metadata: {
                                    ...regime.stateTree.metadata,
                                    description: newDescription,
                                },
                            },
                        });
                    }}
                ></StoryOptions>
            )}

            {sidebar === "assets" && regime.kind === "viewing" && (
                <Assets></Assets>
            )}

            {sidebar === "views" && regime.kind === "viewing" && (
                <Views isMolstarLoading={props.isMolstarLoading}></Views>
            )}
        </Sidebar>
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
