import { useEffect, useMemo, useState, useRef } from "react";
import { useRegime } from "../../../services/RegimeProvider";
import { ViewCard } from "../../view-card/ViewCard";
import type { Subscription } from "rxjs";
import { InactiveViewCard } from "../../view-card/InactiveViewCard";
import { CreateViewCard } from "../../view-card/CreateViewCard";
import { useDialogue } from "../../../services/DialogueProvider";
import {
    ViewOptionsDialogueContent,
    type ViewOptionsDialogueContentReturnType,
} from "./ViewOptionsDialogueContent";
import { UiLocalStorageService } from "../../../services/UiLocalStorageService";
import { pushErrorNotification } from "../../../services/NotificationService";
import { loggerUi } from "../../../utils/loggerUi";
import { useManagedAssets } from "../../../services/ManagedAssetsProvider";
import { DeleteViewDialogueContent } from "./DeleteViewDialogueContent";
import {
    addEmptySnapshotToTree,
    addNewSnapshotToManager,
    applyBackgroundColorToNode,
    applyCameraToNode,
    applySnapshotByIndex,
    clearViewerContent,
    createCopyOfSnapshotInTree,
    extractViewsFromMVS,
    getAllDownloadUrlsFromSnapshot,
    getCurrentSnapshotIndex,
    getSnapshotChangeSubscription,
    removeSnapshotFromTree,
    removeSnapshotInManager,
    updateLiveBackgroundColor,
    updateSnapshotBackgroundColorInManager,
    updateSnapshotCameraInManager,
    updateSnapshotDescriptionInManager,
    updateSnapshotTitleInManager,
} from "../../../../molstar-wrapper/src";

/**
 * Properties for Views component.
 */
interface ViewsProps {
    isMolstarLoading: boolean;
    isBuilderOpen: boolean;
    onOpenBuilder?: (key: string | undefined) => void;
}

/**
 * Views component.
 */
export function Views(props: ViewsProps) {
    // Use regime.
    const { regime, setRegime } = useRegime();

    // Use dialogue.
    const { showDialogue } = useDialogue();

    // Use assets.
    const { getAsset, decrementAssetUseCount } = useManagedAssets();

    // Memoize views extracted from state tree.
    const viewItems = useMemo(() => {
        if (regime.kind === "viewing") {
            return extractViewsFromMVS(regime.stateTree);
        }
        return [];
    }, [regime]);

    // State for the index of currently active view card (default is the first one).
    const [activeViewCardIndex, setActiveViewCardIndex] = useState(0);

    // We use a reference to safely pass the latest variables into the Molstar event listener without having to tear down and rebuild the subscription every time a view changes.
    const latestDataRef = useRef({
        isBuilderOpen: props.isBuilderOpen,
        viewItems,
        activeViewCardIndex,
    });

    useEffect(() => {
        latestDataRef.current = {
            isBuilderOpen: props.isBuilderOpen,
            viewItems,
            activeViewCardIndex,
        };

        // If there are no views or all views were removed, clear viewer.
        if (viewItems.length === 0) {
            clearViewerContent();
        }
    }, [props.isBuilderOpen, viewItems, activeViewCardIndex]);

    // Callback for snapshot selected changed from Molstar UI.
    useEffect(() => {
        let sub: Subscription;
        if (!props.isMolstarLoading) {
            // We reset the index according to `molstar.managers.snapshot.state.current` as soon as the information is available for us.
            setActiveViewCardIndex(getCurrentSnapshotIndex());

            sub = getSnapshotChangeSubscription((index, _) => {
                const {
                    activeViewCardIndex: currentActiveIndex,
                    isBuilderOpen,
                    viewItems,
                } = latestDataRef.current;

                // If the current active index has changed, we should clear the viewer.
                if (currentActiveIndex !== index) {
                    clearViewerContent();
                }

                // Set view card with given index as active.
                setActiveViewCardIndex(index);

                // Remember to update View Builder if it has been previously opened and the view card index changes.
                if (isBuilderOpen && props.onOpenBuilder) {
                    const newView = viewItems[index];
                    if (newView) {
                        props.onOpenBuilder(newView.key);
                    }
                }
            });
        }

        return () => {
            if (sub) sub.unsubscribe();
        };
    }, [props.isMolstarLoading, props.onOpenBuilder]);

    // Render.
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                marginTop: "0.5em",
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "1em",
                }}
            >
                {/* We render "CreateViewCard" component always as the first card. */}
                <CreateViewCard
                    onClick={async () => {
                        // Ignore other non-viewing regime.
                        if (regime.kind !== "viewing") {
                            return;
                        }

                        // Create updated tree.
                        const result = addEmptySnapshotToTree(
                            regime.stateTree,
                            "New View",
                        );

                        // Update regime.
                        setRegime({
                            ...regime,
                            stateTree: result.newStateTree,
                        });

                        const newKey = result.createdNode.metadata.key!;

                        // Update Molstar's snapshot.
                        addNewSnapshotToManager(
                            newKey,
                            result.createdNode.metadata.title!,
                            result.createdNode.metadata.description,
                            result.createdNode.metadata.description_format!,
                            true,
                        );

                        // Move to newly created view.
                        await applySnapshotByIndex(viewItems.length);

                        if (props.isBuilderOpen && props.onOpenBuilder) {
                            props.onOpenBuilder(newKey);
                        }
                    }}
                />

                {viewItems.map((view, index) =>
                    index === activeViewCardIndex ? (
                        <ViewCard
                            key={view.id}
                            index={index}
                            metadata={view}
                            onDelete={async () => {
                                // Ignore other non-viewing regime.
                                if (regime.kind !== "viewing") {
                                    return;
                                }

                                // Show confirmation dialogue.
                                const result = await showDialogue<boolean>({
                                    title: "Delete Confirmation",
                                    width: "550px",
                                    showCloseButton: true,
                                    content: (close) => (
                                        <DeleteViewDialogueContent
                                            viewName={view.title ?? view.id}
                                            close={close}
                                        />
                                    ),
                                });

                                if (!result) {
                                    return;
                                }

                                // Create updated tree.
                                const { updatedTree, removedSnapshot } =
                                    removeSnapshotFromTree(
                                        regime.stateTree,
                                        index,
                                    );

                                // Internal bug in assigned index out of range, do not update anything.
                                if (!removedSnapshot) {
                                    pushErrorNotification(
                                        `Internal error occured! Unable to delete the view. Try once more.`,
                                    );
                                    loggerUi.error(
                                        `Internal error occured! Unable to delete the view. Index <${index}> was out of range (there are currently only <${regime.stateTree.snapshots.length}> snapshots)!`,
                                    );
                                    return;
                                }

                                // Decrease count for deleted assets.
                                const assetsIdsInDeletedSnapshot =
                                    getAllDownloadUrlsFromSnapshot(
                                        removedSnapshot,
                                    );
                                assetsIdsInDeletedSnapshot.forEach((id) => {
                                    const a = getAsset(id);
                                    if (a) {
                                        decrementAssetUseCount(a.asset.url);
                                    }
                                });

                                // Update regime.
                                setRegime({
                                    ...regime,
                                    stateTree: updatedTree,
                                });

                                // Update Molstar's snapshot.
                                removeSnapshotInManager(index);

                                // Move to previous view.
                                await applySnapshotByIndex(
                                    index === 0 ? index : index - 1,
                                );

                                // When I delete view, and buidler is opened, it doe snot update and it is empty
                                if (
                                    props.isBuilderOpen &&
                                    props.onOpenBuilder
                                ) {
                                    props.onOpenBuilder(
                                        updatedTree.snapshots.at(
                                            index === 0 ? index : index - 1,
                                        )?.metadata.key,
                                    );
                                }
                            }}
                            onCopy={async () => {
                                // Ignore other non-viewing regime.
                                if (regime.kind !== "viewing") {
                                    return;
                                }

                                // Create updated tree.
                                const { updatedTree, newSnapshot } =
                                    createCopyOfSnapshotInTree(
                                        regime.stateTree,
                                        index,
                                    );

                                // Internal bug in assigned index out of range, do not update anything.
                                if (!newSnapshot) {
                                    pushErrorNotification(
                                        `Internal error occured! Unable to create copy of the view. Try once more.`,
                                    );
                                    loggerUi.error(
                                        `Internal error occured! Unable to create copy of the view. Index <${index}> was out of range (there are currently only <${regime.stateTree.snapshots.length}> snapshots)!`,
                                    );
                                    return;
                                }

                                // Update regime.
                                setRegime({
                                    ...regime,
                                    stateTree: updatedTree,
                                });

                                const newKey = newSnapshot.metadata.key!;

                                // Update Molstar's snapshot.
                                addNewSnapshotToManager(
                                    newKey,
                                    newSnapshot.metadata.title!,
                                    newSnapshot.metadata.description,
                                    newSnapshot.metadata.description_format!,
                                    false,
                                );

                                // Move to newly copied view.
                                await applySnapshotByIndex(viewItems.length);

                                if (
                                    props.isBuilderOpen &&
                                    props.onOpenBuilder
                                ) {
                                    props.onOpenBuilder(newKey);
                                }
                            }}
                            onCameraSave={(referenceCamera, thumbnail) => {
                                // Ignore other non-viewing regime.
                                if (regime.kind !== "viewing") {
                                    return;
                                }

                                // Create updated tree.
                                const updatedTree = {
                                    ...regime.stateTree,
                                    snapshots: regime.stateTree.snapshots.map(
                                        (snap) => {
                                            if (
                                                snap.metadata.key === view.key!
                                            ) {
                                                return {
                                                    ...snap,
                                                    root: applyCameraToNode(
                                                        snap.root,
                                                        referenceCamera,
                                                        UiLocalStorageService.ViewOptions.getPending(
                                                            view.key!,
                                                        )
                                                            ? thumbnail
                                                            : undefined,
                                                    ),
                                                };
                                            }
                                            return snap;
                                        },
                                    ),
                                };

                                // Update state tree.
                                setRegime({
                                    ...regime,
                                    stateTree: updatedTree,
                                });

                                // Update snapshot's camera in Molstar snapshot manager.
                                updateSnapshotCameraInManager(index);
                            }}
                            onBackgrounColorChange={(color) => {
                                // Ignore other non-viewing regime.
                                if (regime.kind !== "viewing") {
                                    return;
                                }

                                // Create updated tree.
                                const updatedTree = {
                                    ...regime.stateTree,
                                    snapshots: regime.stateTree.snapshots.map(
                                        (snap) => {
                                            if (
                                                snap.metadata.key === view.key
                                            ) {
                                                return {
                                                    ...snap,
                                                    root: applyBackgroundColorToNode(
                                                        snap.root,
                                                        color,
                                                    ),
                                                };
                                            }
                                            return snap;
                                        },
                                    ),
                                };

                                // Update regime.
                                setRegime({
                                    ...regime,
                                    stateTree: updatedTree,
                                });
                            }}
                            onTitleChange={(title) => {
                                // Ignore other non-viewing regime.
                                if (regime.kind !== "viewing") {
                                    return;
                                }

                                // Create updated tree.
                                const updatedTree = {
                                    ...regime.stateTree,
                                    snapshots: regime.stateTree.snapshots.map(
                                        (snap) => {
                                            if (
                                                snap.metadata.key === view.key
                                            ) {
                                                return {
                                                    ...snap,
                                                    metadata: {
                                                        ...snap.metadata,
                                                        title: title,
                                                    },
                                                };
                                            }
                                            return snap;
                                        },
                                    ),
                                };

                                // Update regime.
                                setRegime({
                                    ...regime,
                                    stateTree: updatedTree,
                                });

                                // Update snapshot's title in Molstar snapshot manager.
                                if (title) {
                                    updateSnapshotTitleInManager(index, title);
                                }
                            }}
                            onOpenBuilder={props.onOpenBuilder} // Propagate up to SceneManager.
                            onOpenOptions={async (key) => {
                                // Show dialogue.
                                const result =
                                    await showDialogue<ViewOptionsDialogueContentReturnType>(
                                        {
                                            title: "View Options",
                                            width: "1000px",
                                            showCloseButton: true,
                                            content: (close) => (
                                                <ViewOptionsDialogueContent
                                                    viewKey={key}
                                                    backgroundColor={
                                                        view.backgroundColor
                                                    }
                                                    thumbnail={view.thumbnail}
                                                    close={close}
                                                />
                                            ),
                                        },
                                    );

                                // Ignore other non-viewing regime.
                                if (!result || regime.kind !== "viewing") {
                                    return;
                                }

                                // Saves the screenshot preference for the specific view.
                                UiLocalStorageService.ViewOptions.setPending(
                                    view.key!,
                                    result.captureScreenshot,
                                );

                                // Create updated tree.
                                let updatedTree = {
                                    ...regime.stateTree,
                                    snapshots: regime.stateTree.snapshots.map(
                                        (snap) => {
                                            if (snap.metadata.key === key) {
                                                return {
                                                    ...snap,
                                                    metadata: {
                                                        ...snap.metadata,
                                                        linger_duration_ms:
                                                            result.lingerDuration,
                                                        transition_duration_ms:
                                                            result.transitionDuration,
                                                        description:
                                                            result.description,
                                                        description_format:
                                                            result.descriptionFormat,
                                                    },
                                                };
                                            }
                                            return snap;
                                        },
                                    ),
                                };

                                // Update also background color.
                                updatedTree = {
                                    ...updatedTree,
                                    snapshots: updatedTree.snapshots.map(
                                        (snap) => {
                                            if (snap.metadata.key === key) {
                                                return {
                                                    ...snap,
                                                    root: applyBackgroundColorToNode(
                                                        snap.root,
                                                        result.canvasColor,
                                                    ),
                                                };
                                            }
                                            return snap;
                                        },
                                    ),
                                };

                                // Update regime.
                                setRegime({
                                    ...regime,
                                    stateTree: updatedTree,
                                });

                                // Update snapshot's description in Molstar snapshot manager.
                                updateSnapshotDescriptionInManager(
                                    index,
                                    result.description,
                                    result.descriptionFormat ?? "markdown",
                                );

                                // Update snapshot's background color in Molstar snapshot manager.
                                updateSnapshotBackgroundColorInManager(
                                    index,
                                    result.canvasColor,
                                );

                                // Update live renderer with new background color.
                                updateLiveBackgroundColor(result.canvasColor); // TODO: setBackgroundColor vs updateLiveBackgroundColor
                            }}
                        />
                    ) : (
                        <InactiveViewCard
                            index={index}
                            key={view.key}
                            title={view.title}
                            thumbnail={view.thumbnail}
                            onClick={async () => {
                                await applySnapshotByIndex(index);
                                if (
                                    props.isBuilderOpen &&
                                    props.onOpenBuilder
                                ) {
                                    props.onOpenBuilder(view.key);
                                }
                            }}
                        ></InactiveViewCard>
                    ),
                )}
            </div>
        </div>
    );
}
