/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useCallback, useMemo, useState } from "react";
import { UiLocalStorageService } from "../../../services/UiLocalStorageService";
import { pushErrorNotification } from "../../../services/NotificationService";
import { loggerUi } from "../../../services/UiLoggingService";
import { getFilePathWithoutFile } from "../../../utils/fileDataUtils";
import {
    getAllSupportedAssetsParsers,
    getAssetConfigBasedOnExtension,
} from "../../../config/assetsDefinitions";
import {
    getAllDownloadUrlsFromSnapshot,
    getVolumeParamsForAsset,
    updateNodeParamInAssetBranch,
    reloadMolstarAndRestoreIndex,
    addDownloadNodeToRoot,
    removeDownloadNodeFromRoot,
    getRotationMatrix3x3,
} from "../../../lib/molstar";
import { type MVSData_States } from "molstar/lib/extensions/mvs/mvs-data";
import { useRegimeStore } from "../../../stores/regimeStore";
import { useManagedAssetsStore } from "../../../stores/managedAssetsStore";

/**
 * The unified View-Model for volume parameters.
 */
export interface VolumeViewModel {
    format: string;
    type: string;
    relative_isovalue: number;
    show_wireframe: boolean;
    show_faces: boolean;
    color: string;
    opacity: number;
    translationX: number;
    translationY: number;
    translationZ: number;
    rotationX: number; // Pitch (Degrees)
    rotationY: number; // Yaw (Degrees)
    rotationZ: number; // Roll (Degrees)
}

/**
 * Default volume view model.
 */
export const DEFAULT_VOLUME_VIEW_MODEL: VolumeViewModel = {
    format: "N/A",
    type: "isosurface",
    relative_isovalue: 1.0,
    show_wireframe: false,
    show_faces: true,
    color: "#ffffff",
    opacity: 1.0,
    translationX: 0,
    translationY: 0,
    translationZ: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
};

/**
 * Applies entire View-Model to a Molstar source tree.
 *
 * @param root root of source tree
 * @param assetId asset id of given branch
 * @param viewModel view model
 * @returns modified root
 */
function applyViewModelToBranch(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    root: any,
    assetId: string,
    viewModel: VolumeViewModel,
) {
    let newRoot = root;
    const params = [
        { node: "volume_representation", key: "type", val: viewModel.type },
        {
            node: "volume_representation",
            key: "relative_isovalue",
            val: viewModel.relative_isovalue,
        },
        {
            node: "volume_representation",
            key: "show_wireframe",
            val: viewModel.show_wireframe,
        },
        {
            node: "volume_representation",
            key: "show_faces",
            val: viewModel.show_faces,
        },
        { node: "color", key: "color", val: viewModel.color },
        { node: "opacity", key: "opacity", val: viewModel.opacity },
    ];
    params.forEach((p) => {
        newRoot = updateNodeParamInAssetBranch(
            newRoot,
            assetId,
            p.node,
            p.key,
            p.val,
        );
    });

    const translationArray = [
        viewModel.translationX,
        viewModel.translationY,
        viewModel.translationZ,
    ];
    const rotationArray = getRotationMatrix3x3(
        viewModel.rotationX,
        viewModel.rotationY,
        viewModel.rotationZ,
    );

    newRoot = updateNodeParamInAssetBranch(
        newRoot,
        assetId,
        "transform",
        "translation",
        translationArray,
    );
    newRoot = updateNodeParamInAssetBranch(
        newRoot,
        assetId,
        "transform",
        "rotation",
        rotationArray,
    );

    return newRoot;
}

export function useViewBuilder(viewKey: string) {
    // Use regime.
    const regime = useRegimeStore((state) => state.regime);

    // Use managed assets.
    const assets = useManagedAssetsStore((state) => state.assets);
    const getAsset = useManagedAssetsStore((state) => state.getAsset);
    const incrementAssetUseCount = useManagedAssetsStore(
        (state) => state.incrementAssetUseCount,
    );
    const decrementAssetUseCount = useManagedAssetsStore(
        (state) => state.decrementAssetUseCount,
    );

    // Memoized view.
    const view = useMemo(() => {
        return regime.kind === "viewing"
            ? regime.history
                  .current()
                  .stateTree.snapshots.find(
                      (snap) => snap.metadata.key === viewKey,
                  )
            : null;
    }, [regime, viewKey]);

    // State to keep track which asset in the list is expanded.
    const [expandedAssetId, setExpandedAssetId] = useState<string | null>(() =>
        UiLocalStorageService.ViewBuilder.getExpandedAssetId(viewKey),
    );

    // State for all selected assets IDs in UI.
    const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>(() =>
        view ? getAllDownloadUrlsFromSnapshot(view) : [],
    );

    // Current record of volume view models for each asset.
    const [viewModels, setViewModels] = useState<
        Record<string, VolumeViewModel>
    >({});

    const [prevView, setPrevView] = useState(view);

    // Refresh UI if view changes (as result of undo/redo actions).
    if (view !== prevView) {
        setPrevView(view);
        setSelectedAssetIds(view ? getAllDownloadUrlsFromSnapshot(view) : []);
        setViewModels({});
    }

    // Current selected asset filters.
    const [selectedAssetFilters, setSelectedAssetFilters] = useState<string[]>(
        UiLocalStorageService.ViewBuilder.getAssetFilters(viewKey) ?? ["All"],
    );

    // Current selected asset relative paths.
    const [selectedAssetRelativePaths, setSelectedAssetRelativePaths] =
        useState<string[]>(
            UiLocalStorageService.ViewBuilder.getAssetFolders(viewKey) ?? [
                "All",
            ],
        );

    const [areFiltersExpanded, setAreFiltersExpanded] = useState(
        UiLocalStorageService.ViewBuilder.getExpandedFiltersSection(viewKey),
    );

    // Memoized assets filtered only by tag (local/remote) and extension (.cif/.map/...).
    const assetsFilteredByType = useMemo(() => {
        const allAssets = Array.from(assets.values());

        if (selectedAssetFilters.length === 0) return [];
        if (selectedAssetFilters.includes("All")) return allAssets;

        const hasLocationFilters = selectedAssetFilters.some(
            (f) => f === "Local assets" || f === "Remote assets",
        );
        const hasExtensionFilters = selectedAssetFilters.some((f) =>
            f.startsWith("."),
        );

        return allAssets.filter((asset) => {
            let matchesLocation = !hasLocationFilters;
            if (hasLocationFilters) {
                if (
                    selectedAssetFilters.includes("Local assets") &&
                    asset.tag === "local"
                )
                    matchesLocation = true;
                if (
                    selectedAssetFilters.includes("Remote assets") &&
                    asset.tag === "remote"
                )
                    matchesLocation = true;
            }

            let matchesExtension = !hasExtensionFilters;
            if (hasExtensionFilters) {
                matchesExtension = selectedAssetFilters.some(
                    (ext) =>
                        asset.extension.toLowerCase() ===
                        ext.slice(1).toLowerCase(),
                );
            }

            return matchesLocation && matchesExtension;
        });
    }, [assets, selectedAssetFilters]);

    // Memoized assets further narrowed down by relative paths.
    const assetsInView = useMemo(() => {
        if (selectedAssetRelativePaths.includes("All")) {
            return assetsFilteredByType;
        }

        return assetsFilteredByType.filter((asset) => {
            const path = getFilePathWithoutFile(asset.relativePath);
            const normalizedAssetPath = !path ? "./" : path;
            return selectedAssetRelativePaths.includes(normalizedAssetPath);
        });
    }, [assetsFilteredByType, selectedAssetRelativePaths]);

    // Function which returns safe view model based on asset ID.
    const getViewModel = useCallback(
        (assetId: string): VolumeViewModel => {
            if (viewModels[assetId]) {
                return viewModels[assetId];
            }

            const fallback: VolumeViewModel = {
                ...DEFAULT_VOLUME_VIEW_MODEL,
                format:
                    getAssetConfigBasedOnExtension(
                        getAsset(assetId)?.extension || "",
                    )?.parser || "N/A",
            };

            if (!view) {
                return fallback;
            }

            return getVolumeParamsForAsset(
                view.root,
                assetId,
                fallback,
            ) as VolumeViewModel;
        },
        [viewModels, getAsset, view],
    );

    // Handler for expanding the asset card.
    const toggleExpandAsset = (assetId: string) => {
        const nextId = expandedAssetId === assetId ? null : assetId;
        setExpandedAssetId(nextId);
        UiLocalStorageService.ViewBuilder.setExpandedAssetId(viewKey, nextId);
    };

    // Function which updates view model and optionally sync it to Molstar.
    const updateViewModel = async (
        assetId: string,
        paramKey: keyof VolumeViewModel,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        val: any,
        syncToMolstar: boolean,
    ) => {
        const updatedVm = { ...getViewModel(assetId), [paramKey]: val };

        // Update UI instantly.
        setViewModels((prev) => ({ ...prev, [assetId]: updatedVm }));

        // Sync to Molstar only if requested and the asset is checked.
        if (
            syncToMolstar &&
            selectedAssetIds.includes(assetId) &&
            regime.kind === "viewing"
        ) {
            // Update source tree.
            const updatedTree: MVSData_States = {
                ...regime.history.current().stateTree,
                snapshots: regime.history
                    .current()
                    .stateTree.snapshots.map((snap) =>
                        snap.metadata.key === viewKey
                            ? {
                                  ...snap,
                                  root: applyViewModelToBranch(
                                      snap.root,
                                      assetId,
                                      updatedVm,
                                  ),
                              }
                            : snap,
                    ),
            };

            // Update regime.
            regime.commitStateTree(
                updatedTree,
                `Updated "${paramKey}" for view "${view?.metadata.title}" (${viewKey}).`,
            );

            // Try to reload Molstar viewer.
            const result = await reloadMolstarAndRestoreIndex(
                { key: viewKey },
                Array.from(assets.values()),
                updatedTree,
            );
            if (result instanceof Error) {
                pushErrorNotification(
                    `Failed to apply changes! For more information, check the logs.`,
                );
                loggerUi.error(result.message);

                regime.undo();
            }
        }
    };

    // Handler when asset is toggled.
    const handleAssetToggle = async (
        toggledAssetId: string,
        isChecked: boolean,
    ) => {
        // If it is checked, it means we need to add it, otherwise remove it.
        let newSelectedIds: string[];
        if (isChecked) {
            newSelectedIds = [...selectedAssetIds, toggledAssetId];
        } else {
            newSelectedIds = selectedAssetIds.filter(
                (id) => id !== toggledAssetId,
            );
        }

        // Inform managed asset manager this given asset count was increased/decreased.
        const a = getAsset(toggledAssetId);
        if (a) {
            if (isChecked) {
                incrementAssetUseCount(a.asset.url);
            } else {
                decrementAssetUseCount(a.asset.url);
            }
        }

        // Update UI state.
        setSelectedAssetIds(newSelectedIds);

        if (regime.kind !== "viewing") {
            return;
        }

        // Create updated state tree.
        const updatedTree: MVSData_States = {
            ...regime.history.current().stateTree,
            snapshots: regime.history
                .current()
                .stateTree.snapshots.map((snap) => {
                    if (snap.metadata.key === viewKey) {
                        let newRoot;

                        if (isChecked) {
                            // Get changes from our view model.
                            const draftedParams = getViewModel(toggledAssetId);

                            // New root.
                            newRoot = addDownloadNodeToRoot(
                                snap.root,
                                toggledAssetId,
                                getAsset(toggledAssetId)?.extension ||
                                    "unknown",
                                getAllSupportedAssetsParsers(),
                                draftedParams,
                            );

                            // Cleanly apply the current view model state to the newly created branch.
                            if (viewModels[toggledAssetId]) {
                                newRoot = applyViewModelToBranch(
                                    newRoot,
                                    toggledAssetId,
                                    viewModels[toggledAssetId],
                                );
                            }
                        } else {
                            newRoot = removeDownloadNodeFromRoot(
                                snap.root,
                                toggledAssetId,
                            );
                        }

                        return { ...snap, root: newRoot };
                    }
                    return snap;
                }),
        };

        // Update regime.
        regime.commitStateTree(
            updatedTree,
            `Updated asset "${toggledAssetId}" for view "${view?.metadata.title}" (${viewKey}).`,
        );

        // Try to reload Molstar viewer.
        const result = await reloadMolstarAndRestoreIndex(
            { key: viewKey },
            Array.from(assets.values()),
            updatedTree,
        );

        if (result instanceof Error) {
            pushErrorNotification(
                `Failed to apply changes! It is possible that given asset cannot be used in the MVS. For more information, check the logs.`,
            );
            loggerUi.error(result.message);

            if (a) {
                if (isChecked) {
                    decrementAssetUseCount(a.asset.url);
                } else {
                    incrementAssetUseCount(a.asset.url);
                }
            }

            setSelectedAssetIds(selectedAssetIds);
            regime.undo();
        }
    };

    return {
        view,
        assetsInView,
        assetsFilteredByType,
        areFiltersExpanded,
        setAreFiltersExpanded,
        selectedAssetFilters,
        setSelectedAssetFilters,
        selectedAssetRelativePaths,
        setSelectedAssetRelativePaths,
        selectedAssetIds,
        expandedAssetId,
        getViewModel,
        toggleExpandAsset,
        updateViewModel,
        handleAssetToggle,
    };
}
