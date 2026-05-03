import { useEffect, useMemo, useState, useRef } from "react";
import { useRegime } from "../../../services/RegimeProvider";
import { ViewCard } from "../../view-card/ViewCard";
import {
    addEmptySnapshotToTree,
    addNewSnapshotToManager,
    applyBackgroundColorToNode,
    applyChangesToNode,
    applySnapshotByIndex,
    clearViewerContent,
    extractViewsFromMVS,
    getCurrentSnapshotIndex,
    getSnapshotChangeSubscription,
    reloadMolstarAndRestoreIndex,
} from "../../../../molstar-wrapper/src";
import type { Subscription } from "rxjs";
import { InactiveViewCard } from "../../view-card/InactiveViewCard";
import { CreateViewCard } from "../../view-card/CreateViewCard";
import { useDialogue } from "../../../services/DialogueProvider";
import {
    ViewOptionsDialogueContent,
    type ViewOptionsDialogueContentReturnType,
} from "./ViewOptionsDialogueContent";
import { useManagedAssets } from "../../../services/ManagedAssetsProvider";
import { UiLocalStorageService } from "../../../services/UiLocalStorageService";

interface ViewsProps {
    isMolstarLoading: boolean;
    isBuilderOpen: boolean;
    onOpenBuilder?: (key: string | undefined) => void;
}

export function Views(props: ViewsProps) {
    // Use regime.
    const { regime, setRegime } = useRegime();

    // Use dialogue.
    const { showDialogue } = useDialogue();

    // Use assets.
    const { getAllAssets } = useManagedAssets();

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
    });
    useEffect(() => {
        latestDataRef.current = {
            isBuilderOpen: props.isBuilderOpen,
            viewItems,
        };
    }, [props.isBuilderOpen, viewItems]);

    // Callback for snapshot selected changed from Molstar UI.
    useEffect(() => {
        let sub: Subscription;
        if (!props.isMolstarLoading) {
            // We reset the index according to `molstar.managers.snapshot.state.current` as soon as the information is available for us.
            setActiveViewCardIndex(getCurrentSnapshotIndex());

            sub = getSnapshotChangeSubscription((index, _) => {
                setActiveViewCardIndex(index);
                const { isBuilderOpen, viewItems } = latestDataRef.current;
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
                <CreateViewCard
                    onClick={async () => {
                        if (regime.kind === "viewing") {
                            const result = addEmptySnapshotToTree(
                                regime.stateTree,
                            );

                            setRegime({
                                ...regime,
                                stateTree: result.newStateTree,
                            });

                            await clearViewerContent();

                            const newKey =
                                result.createdNode.metadata.key ??
                                crypto.randomUUID();

                            addNewSnapshotToManager(
                                newKey,
                                result.createdNode.metadata.title ?? "New View",
                                result.createdNode.metadata.description,
                                result.createdNode.metadata
                                    .description_format ?? "markdown",
                                true,
                            );

                            await applySnapshotByIndex(viewItems.length);

                            if (props.isBuilderOpen && props.onOpenBuilder) {
                                props.onOpenBuilder(newKey);
                            }
                        }
                    }}
                />

                {viewItems.map((view, index) =>
                    index === activeViewCardIndex ? (
                        <ViewCard
                            key={view.id}
                            index={index}
                            metadata={view}
                            onClick={async () => {
                                await applySnapshotByIndex(index);
                            }}
                            onCameraSave={(referenceCamera, thumbnail) => {
                                // Ignore other not-viewing regime.
                                if (regime.kind !== "viewing") {
                                    return;
                                }

                                // Create updated source tree.
                                const updatedTree = {
                                    ...regime.stateTree,
                                    snapshots: regime.stateTree.snapshots.map(
                                        (snap) => {
                                            if (
                                                snap.metadata.key === view.key!
                                            ) {
                                                return {
                                                    ...snap,
                                                    root: applyChangesToNode(
                                                        snap.root,
                                                        referenceCamera,
                                                        UiLocalStorageService.getPendingScreenshot(
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
                            }}
                            onBackgrounColorChange={(color) => {
                                // Ignore other not-viewing regime.
                                if (regime.kind !== "viewing") {
                                    return;
                                }

                                // Create updated source tree.
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

                                // Update state tree.
                                setRegime({
                                    ...regime,
                                    stateTree: updatedTree,
                                });
                            }}
                            onTitleChange={(title) => {
                                // Ignore other not-viewing regime.
                                if (regime.kind !== "viewing") {
                                    return;
                                }

                                // Create updated source tree.
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

                                // Update state tree.
                                setRegime({
                                    ...regime,
                                    stateTree: updatedTree,
                                });

                                // TODO: use updateSnapshotInManager to update
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

                                // Ignore other not-viewing regime.
                                if (!result || regime.kind !== "viewing") {
                                    return;
                                }

                                // Saves the screenshot preference for the specific view.
                                UiLocalStorageService.setPendingScreenshot(
                                    view.key!,
                                    result.captureScreenshot,
                                );

                                // Create updated source tree.
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

                                // Update state tree.
                                setRegime({
                                    ...regime,
                                    stateTree: updatedTree,
                                });

                                // TODO: is it really necessary to reload whole Molstar, isn't enought to call updateSnapshotInManager only?
                                // Reload Molstar viewer.
                                reloadMolstarAndRestoreIndex(
                                    key,
                                    getAllAssets(),
                                    updatedTree,
                                );
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
