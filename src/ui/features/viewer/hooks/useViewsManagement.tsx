/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useEffect, useMemo, useState, useRef } from "react";
import type { Subscription } from "rxjs";
import { DeleteViewDialogueContent } from "../components/scene-manager/views-sidebar/DeleteViewDialogueContent";
import { pushErrorNotification } from "../../../services/NotificationService";
import { loggerUi } from "../../../services/UiLoggingService";
import { UiLocalStorageService } from "../../../services/UiLocalStorageService";
import {
    ViewOptionsDialogueContent,
    type ViewOptionsDialogueContentReturnType,
} from "../components/scene-manager/views-sidebar/ViewOptionsDialogueContent";
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
    type CameraState,
    type HexColor,
    type ViewMetadata,
} from "../../../lib/molstar";
import { useRegimeStore } from "../../../stores/regimeStore";
import { useManagedAssetsStore } from "../../../stores/managedAssetsStore";
import { useDialogueStore } from "../../../stores/dialogueStore";

interface useViewsManagementProps {
    isBuilderOpen: boolean;
    isMolstarLoading: boolean;
    onOpenBuilder?: (key: string | undefined) => void;
}

export function useViewsManagement({
    isBuilderOpen,
    isMolstarLoading,
    onOpenBuilder,
}: useViewsManagementProps) {
    // Use regime.
    const regime = useRegimeStore((state) => state.regime);

    // Use managed assets.
    const getAsset = useManagedAssetsStore((state) => state.getAsset);
    const incrementAssetUseCount = useManagedAssetsStore(
        (state) => state.incrementAssetUseCount,
    );
    const decrementAssetUseCount = useManagedAssetsStore(
        (state) => state.decrementAssetUseCount,
    );

    // State for the index of currently active view card (default is the first one).
    const [activeViewCardIndex, setActiveViewCardIndex] = useState(0);

    // Memoize views extracted from state tree.
    const viewItems = useMemo(() => {
        return regime.kind === "viewing"
            ? extractViewsFromMVS(regime.history.current().stateTree)
            : [];
    }, [regime]);

    // We use a reference to safely pass the latest variables into the Molstar event listener without having to tear down and rebuild the subscription every time a view changes.
    const latestDataRef = useRef({
        isBuilderOpen,
        viewItems,
        activeViewCardIndex,
    });

    // We update reference.
    useEffect(() => {
        latestDataRef.current = {
            isBuilderOpen,
            viewItems,
            activeViewCardIndex,
        };

        // If there are no views or all views were removed, clear viewer.
        if (viewItems.length === 0) {
            clearViewerContent();
        }
    }, [isBuilderOpen, viewItems, activeViewCardIndex]);

    // Callback for snapshot selected changed from Molstar UI.
    useEffect(() => {
        let sub: Subscription;

        const syncActiveView = (index: number) => {
            setActiveViewCardIndex(index);
            const current = latestDataRef.current;
            if (current.isBuilderOpen && onOpenBuilder) {
                const newView = current.viewItems[index];
                if (newView) onOpenBuilder(newView.key);
            }
        };

        if (!isMolstarLoading) {
            queueMicrotask(() => {
                syncActiveView(getCurrentSnapshotIndex());
            });

            sub = getSnapshotChangeSubscription((index) => {
                if (latestDataRef.current.activeViewCardIndex !== index) {
                    clearViewerContent();
                }
                syncActiveView(index);
            });
        }

        return () => sub?.unsubscribe();
    }, [isMolstarLoading, onOpenBuilder]);

    const handleCreateView = async () => {
        // Ignore other non-viewing regime.
        if (regime.kind !== "viewing") {
            return;
        }

        // Create updated tree.
        const result = addEmptySnapshotToTree(
            regime.history.current().stateTree,
            "New View",
        );

        // Update regime.
        regime.commitStateTree(
            result.newStateTree,
            "Added new blank view.",
            viewItems.length,
        );

        // Update Molstar's snapshot.
        const newKey = result.createdNode.metadata.key!;
        addNewSnapshotToManager(
            newKey,
            result.createdNode.metadata.title!,
            result.createdNode.metadata.description,
            result.createdNode.metadata.description_format!,
            true,
        );

        // Move to newly created view.
        await applySnapshotByIndex(viewItems.length);

        if (isBuilderOpen && onOpenBuilder) {
            onOpenBuilder(newKey);
        }
    };

    const handleDeleteView = async (index: number, view: ViewMetadata) => {
        // Ignore other non-viewing regime.
        if (regime.kind !== "viewing") {
            return;
        }

        // Show confirmation dialogue.
        const result = await useDialogueStore.getState().showDialogue<boolean>({
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
        const { updatedTree, removedSnapshot } = removeSnapshotFromTree(
            regime.history.current().stateTree,
            index,
        );

        // Internal bug in assigned index out of range, do not update anything.
        if (!removedSnapshot) {
            pushErrorNotification(
                `Internal error occured! Unable to delete the view. Try once more.`,
            );
            loggerUi.error(
                `Internal error occured! Unable to delete the view. Index <${index}> was out of range (there are currently only <${
                    regime.history.current().stateTree.snapshots.length
                }> snapshots)!`,
            );
            return;
        }

        // Decrease count for deleted assets.
        const assetsIdsInDeletedSnapshot =
            getAllDownloadUrlsFromSnapshot(removedSnapshot);
        assetsIdsInDeletedSnapshot.forEach((id) => {
            const a = getAsset(id);
            if (a) {
                decrementAssetUseCount(a.asset.url);
            }
        });

        // Update regime.
        regime.commitStateTree(
            updatedTree,
            `Deleted view "${view.title}" (${view.key}).`,
            index === 0 ? index : index - 1,
        );

        // Update Molstar's snapshot.
        removeSnapshotInManager(index);

        // Move to previous view.
        await applySnapshotByIndex(index === 0 ? index : index - 1);

        // When I delete view, and the builder is opened, it does not update and it is empty.
        if (isBuilderOpen && onOpenBuilder) {
            onOpenBuilder(
                updatedTree.snapshots.at(index === 0 ? index : index - 1)
                    ?.metadata.key,
            );
        }
    };

    const handleCopyView = async (index: number) => {
        // Ignore other non-viewing regime.
        if (regime.kind !== "viewing") {
            return;
        }

        // Create updated tree.
        const { updatedTree, newSnapshot } = createCopyOfSnapshotInTree(
            regime.history.current().stateTree,
            index,
        );

        // Internal bug in assigned index out of range, do not update anything.
        if (!newSnapshot) {
            pushErrorNotification(
                `Internal error occured! Unable to create copy of the view. Try once more.`,
            );
            loggerUi.error(
                `Internal error occured! Unable to create copy of the view. Index <${index}> was out of range (there are currently only <${
                    regime.history.current().stateTree.snapshots.length
                }> snapshots)!`,
            );
            return;
        }

        // Increase count for copied assets.
        const assetsIdsInCopiedSnapshot =
            getAllDownloadUrlsFromSnapshot(newSnapshot);
        assetsIdsInCopiedSnapshot.forEach((id) => {
            const a = getAsset(id);
            if (a) {
                incrementAssetUseCount(a.asset.url);
            }
        });

        // Update regime.
        regime.commitStateTree(
            updatedTree,
            `Made a copy of the ${index}. view.`,
            viewItems.length,
        );

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

        if (isBuilderOpen && onOpenBuilder) {
            onOpenBuilder(newKey);
        }
    };

    const handleCameraSave = (
        index: number,
        view: ViewMetadata,
        referenceCamera: CameraState,
        thumbnail: Base64URLString | undefined,
    ) => {
        // Ignore other non-viewing regime.
        if (regime.kind !== "viewing") {
            return;
        }

        // Create updated tree.
        const updatedTree = {
            ...regime.history.current().stateTree,
            snapshots: regime.history
                .current()
                .stateTree.snapshots.map((snap) => {
                    if (snap.metadata.key === view.key!) {
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
                }),
        };

        // Update state tree.
        regime.commitStateTree(
            updatedTree,
            `Saved camera for "${view.title}" (${view.key}).`,
        );

        // Update snapshot's camera in Molstar snapshot manager.
        updateSnapshotCameraInManager(index);
    };

    const handleTitleChange = (
        index: number,
        view: ViewMetadata,
        title: string | undefined,
    ) => {
        // Ignore other non-viewing regime.
        if (regime.kind !== "viewing") {
            return;
        }

        // Create updated tree.
        const updatedTree = {
            ...regime.history.current().stateTree,
            snapshots: regime.history
                .current()
                .stateTree.snapshots.map((snap) => {
                    if (snap.metadata.key === view.key) {
                        return {
                            ...snap,
                            metadata: {
                                ...snap.metadata,
                                title: title,
                            },
                        };
                    }
                    return snap;
                }),
        };

        // Update regime.
        regime.commitStateTree(
            updatedTree,
            `Updated title for view "${view.title}" (${view.key}).`,
        );

        // Update snapshot's title in Molstar snapshot manager.
        if (title) {
            updateSnapshotTitleInManager(index, title);
        }
    };

    const handleOpenOptions = async (
        index: number,
        view: ViewMetadata,
        key: string,
    ) => {
        // Show dialogue.
        const result = await useDialogueStore
            .getState()
            .showDialogue<ViewOptionsDialogueContentReturnType>({
                title: "View Options",
                width: "1000px",
                showCloseButton: true,
                content: (close) => (
                    <ViewOptionsDialogueContent
                        viewKey={key}
                        backgroundColor={view.backgroundColor}
                        anyThumbnail={view.thumbnail !== undefined}
                        captureScreenshot={UiLocalStorageService.ViewOptions.getPending(
                            view.key!,
                        )}
                        close={close}
                    />
                ),
            });

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
            ...regime.history.current().stateTree,
            snapshots: regime.history
                .current()
                .stateTree.snapshots.map((snap) => {
                    if (snap.metadata.key === key) {
                        return {
                            ...snap,
                            metadata: {
                                ...snap.metadata,
                                linger_duration_ms: result.lingerDuration,
                                transition_duration_ms:
                                    result.transitionDuration,
                                description: result.description,
                                description_format: result.descriptionFormat,
                            },
                        };
                    }
                    return snap;
                }),
        };

        // Update also background color.
        updatedTree = {
            ...updatedTree,
            snapshots: updatedTree.snapshots.map((snap) => {
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
            }),
        };

        // Update regime.
        regime.commitStateTree(
            updatedTree,
            `Updated options for view "${view.title}" (${view.key}).`,
        );

        // Update snapshot's description in Molstar snapshot manager.
        updateSnapshotDescriptionInManager(
            index,
            result.description,
            result.descriptionFormat ?? "markdown",
        );

        // Update snapshot's background color in Molstar snapshot manager.
        updateSnapshotBackgroundColorInManager(index, result.canvasColor);

        // Update live renderer with new background color.
        updateLiveBackgroundColor(result.canvasColor); // TODO: setBackgroundColor vs updateLiveBackgroundColor
    };

    const handleSelectActiveView = async (
        index: number,
        view: ViewMetadata,
    ) => {
        await applySnapshotByIndex(index);
        if (isBuilderOpen && onOpenBuilder) {
            onOpenBuilder(view.key);
        }
    };

    const handleBackgroundColorChange = (
        view: ViewMetadata,
        color: HexColor,
    ) => {
        // Ignore other non-viewing regime.
        if (regime.kind !== "viewing") {
            return;
        }

        // Avoids redundant commits from Molstar echoing a color we already pushed via the Options dialog.
        if (view.backgroundColor === color) return;

        // Create updated tree.
        const updatedTree = {
            ...regime.history.current().stateTree,
            snapshots: regime.history
                .current()
                .stateTree.snapshots.map((snap) => {
                    if (snap.metadata.key === view.key) {
                        return {
                            ...snap,
                            root: applyBackgroundColorToNode(snap.root, color),
                        };
                    }
                    return snap;
                }),
        };

        // Update regime.
        regime.commitStateTree(
            updatedTree,
            `Updated background color for view "${view.title}" (${view.key}).`,
        );
    };

    return {
        viewItems,
        activeViewCardIndex,
        handleCreateView,
        handleDeleteView,
        handleCopyView,
        handleCameraSave,
        handleBackgroundColorChange,
        handleTitleChange,
        handleOpenOptions,
        handleSelectActiveView,
    };
}
