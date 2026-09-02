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
    getParser,
} from "../../../config/assetsDefinitions";
import {
    getAllDownloadUrlsFromSnapshot,
    getVolumeParamsForAsset,
    updateNodeParamInAssetBranch,
    reloadMolstarAndRestoreIndex,
    removeDownloadNodeFromRoot,
    getRotationMatrix3x3,
    getStructureParamsForAsset,
    addVolumeDownloadNodeToRoot,
    addStructureDownloadNodeToRoot,
    setStructureComponentsInAssetBranch,
} from "../../../lib/molstar";
import { type MVSData_States } from "molstar/lib/extensions/mvs/mvs-data";
import { useRegimeStore } from "../../../stores/regimeStore";
import { useManagedAssetsStore } from "../../../stores/managedAssetsStore";
import {
    DEFAULT_STRUCTURE_VIEW_MODEL,
    DEFAULT_VOLUME_VIEW_MODEL,
    type ComponentEntry,
    type StructureViewModel,
    type VolumeViewModel,
} from "../models/MvsViewModels";

export type TabType = "structure" | "volume";

/**
 * Applies an entire structure View-Model to a Molstar source tree.
 *
 * @param root root of source tree
 * @param assetId asset id of given branch
 * @param viewModel view model
 * @returns modified root
 */
export function applyStructureViewModelToBranch(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    root: any,
    assetId: string,
    viewModel: StructureViewModel,
) {
    let newRoot = root;

    const params: { node: string; key: string; val: unknown }[] = [
        { node: "structure", key: "type", val: viewModel.type },
        { node: "structure", key: "block_header", val: viewModel.block_header },
        { node: "structure", key: "block_index", val: viewModel.block_index },
        { node: "structure", key: "model_index", val: viewModel.model_index },
        {
            node: "structure",
            key: "coordinates_ref",
            val: viewModel.coordinates_ref,
        },
    ];

    // type-conditional structure params — only pushed when relevant so we
    // never write e.g. `radius` onto a "model" structure.
    if (viewModel.type === "assembly") {
        params.push({
            node: "structure",
            key: "assembly_id",
            val: viewModel.assembly_id,
        });
    }
    if (viewModel.type === "symmetry_mates") {
        params.push({
            node: "structure",
            key: "radius",
            val: viewModel.radius,
        });
    }
    if (viewModel.type === "symmetry") {
        params.push({
            node: "structure",
            key: "ijk_min",
            val: viewModel.ijk_min,
        });
        params.push({
            node: "structure",
            key: "ijk_max",
            val: viewModel.ijk_max,
        });
    }

    params.forEach((p) => {
        newRoot = updateNodeParamInAssetBranch(
            newRoot,
            assetId,
            p.node,
            p.key,
            p.val,
        );
    });

    // components — wholesale replace (selector, representation, color, opacity,
    // focus, and transform all rebuilt together per component). See
    // setStructureComponentsInAssetBranch / buildComponentNode.
    newRoot = setStructureComponentsInAssetBranch(
        newRoot,
        assetId,
        viewModel.components,
    );

    return newRoot;
}

/**
 * Applies entire View-Model to a Molstar source tree.
 *
 * @param root root of source tree
 * @param assetId asset id of given branch
 * @param viewModel view model
 * @returns modified root
 */
function applyVolumeViewModelToBranch(
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

    // Current record of view models for each asset.
    const [volumeViewModels, setVolumeViewModels] = useState<
        Record<string, VolumeViewModel>
    >({});

    const [structureViewModels, setStructureViewModels] = useState<
        Record<string, StructureViewModel>
    >({});

    const [prevView, setPrevView] = useState(view);

    // Refresh UI if view changes (as result of undo/redo actions).
    if (view !== prevView) {
        setPrevView(view);
        setSelectedAssetIds(view ? getAllDownloadUrlsFromSnapshot(view) : []);
        setVolumeViewModels({});
        setStructureViewModels({});
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

    // Function which returns safe volume view model based on asset ID.
    const getVolumeViewModel = useCallback(
        (assetId: string): VolumeViewModel => {
            if (volumeViewModels[assetId]) {
                return volumeViewModels[assetId];
            }

            const fallback: VolumeViewModel = {
                ...DEFAULT_VOLUME_VIEW_MODEL,
                format:
                    getParser(getAsset(assetId)?.extension || "unknown") ||
                    "N/A",
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
        [volumeViewModels, getAsset, view],
    );

    // Function which returns safe structure view model based on asset ID.
    const getStructureViewModel = useCallback(
        (assetId: string): StructureViewModel => {
            if (structureViewModels[assetId]) {
                return structureViewModels[assetId];
            }

            const fallback: StructureViewModel = {
                ...DEFAULT_STRUCTURE_VIEW_MODEL,
                format:
                    getParser(getAsset(assetId)?.extension || "unknown") ||
                    "N/A",
            };

            if (!view) {
                return fallback;
            }

            return getStructureParamsForAsset(
                view.root,
                assetId,
                fallback,
            ) as StructureViewModel;
        },
        [structureViewModels, getAsset, view],
    );

    // Handler for expanding the asset card.
    const toggleExpandAsset = (assetId: string) => {
        const nextId = expandedAssetId === assetId ? null : assetId;
        setExpandedAssetId(nextId);
        UiLocalStorageService.ViewBuilder.setExpandedAssetId(viewKey, nextId);
    };

    // Function which updates volume view model and optionally sync it to Molstar.
    const updateVolumeViewModel = async (
        assetId: string,
        paramKey: keyof VolumeViewModel,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        val: any,
        syncToMolstar: boolean,
    ) => {
        const updatedVm = { ...getVolumeViewModel(assetId), [paramKey]: val };

        // Update UI instantly.
        setVolumeViewModels((prev) => ({ ...prev, [assetId]: updatedVm }));

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
                                  root: applyVolumeViewModelToBranch(
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

    // Function which updates structure view model and optionally sync it to Molstar.
    const updateStructureViewModel = async (
        assetId: string,
        paramKey: keyof StructureViewModel,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        val: any,
        syncToMolstar: boolean,
    ) => {
        const updatedVm = {
            ...getStructureViewModel(assetId),
            [paramKey]: val,
        };

        // Update UI instantly.
        setStructureViewModels((prev) => ({ ...prev, [assetId]: updatedVm }));

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
                                  root: applyStructureViewModelToBranch(
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

    const updateStructureComponentViewModel = async (
        assetId: string,
        componentId: string,
        paramKey: keyof ComponentEntry,
        val: ComponentEntry[keyof ComponentEntry],
        syncToMolstar: boolean,
    ) => {
        // 1. Retrieve the current view model for the asset
        const currentVm = getStructureViewModel(assetId);

        // 2. Map over components to apply the change to the specific component ID
        const updatedComponents = currentVm.components.map((comp) =>
            comp.id === componentId ? { ...comp, [paramKey]: val } : comp,
        );

        const updatedVm: StructureViewModel = {
            ...currentVm,
            components: updatedComponents,
        };

        // 3. Update the UI state instantly
        setStructureViewModels((prev) => ({ ...prev, [assetId]: updatedVm }));

        // 4. Sync to Molstar if requested and viewing conditions are met
        if (
            syncToMolstar &&
            selectedAssetIds.includes(assetId) &&
            regime.kind === "viewing"
        ) {
            const updatedTree: MVSData_States = {
                ...regime.history.current().stateTree,
                snapshots: regime.history
                    .current()
                    .stateTree.snapshots.map((snap) =>
                        snap.metadata.key === viewKey
                            ? {
                                  ...snap,
                                  root: applyStructureViewModelToBranch(
                                      snap.root,
                                      assetId,
                                      updatedVm, // Passes the updated VM with the modified component array
                                  ),
                              }
                            : snap,
                    ),
            };

            // Update regime history
            regime.commitStateTree(
                updatedTree,
                `Updated component "${componentId}" param "${paramKey}" for view "${view?.metadata.title}" (${viewKey}).`,
            );

            // Try to reload Molstar viewer
            const result = await reloadMolstarAndRestoreIndex(
                { key: viewKey },
                Array.from(assets.values()),
                updatedTree,
            );

            if (result instanceof Error) {
                pushErrorNotification(
                    `Failed to apply component changes! For more information, check the logs.`,
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
        tabType: TabType,
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
                            // TODO: here we need to know if to add volume or structur

                            if (tabType === "volume") {
                                // Get changes from our view model.
                                const draftedParams =
                                    getVolumeViewModel(toggledAssetId);

                                // New root.
                                newRoot = addVolumeDownloadNodeToRoot(
                                    snap.root,
                                    toggledAssetId,
                                    getAsset(toggledAssetId)?.extension ||
                                        "unknown",
                                    getAllSupportedAssetsParsers(),
                                    draftedParams,
                                );

                                // Cleanly apply the current view model state to the newly created branch.
                                if (volumeViewModels[toggledAssetId]) {
                                    newRoot = applyVolumeViewModelToBranch(
                                        newRoot,
                                        toggledAssetId,
                                        volumeViewModels[toggledAssetId],
                                    );
                                }
                            } else {
                                // Get changes from our view model.
                                const draftedParams =
                                    getStructureViewModel(toggledAssetId);

                                // New root.
                                newRoot = addStructureDownloadNodeToRoot(
                                    snap.root,
                                    toggledAssetId,
                                    getAsset(toggledAssetId)?.extension ||
                                        "unknown",
                                    getAllSupportedAssetsParsers(),
                                    draftedParams,
                                );

                                // Cleanly apply the current view model state to the newly created branch.
                                if (structureViewModels[toggledAssetId]) {
                                    newRoot = applyStructureViewModelToBranch(
                                        newRoot,
                                        toggledAssetId,
                                        structureViewModels[toggledAssetId],
                                    );
                                }
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
        getVolumeViewModel,
        getStructureViewModel,
        toggleExpandAsset,
        updateVolumeViewModel,
        updateStructureViewModel,
        updateStructureComponentViewModel,
        handleAssetToggle,
    };
}
