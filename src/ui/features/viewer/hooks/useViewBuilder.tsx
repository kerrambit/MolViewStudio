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
} from "../../assets/domain/assetsDefinitions";
import {
    addStructureNodeToTree,
    addVolumeNodeToTree,
    getAllDownloadUrlsFromSnapshot,
    getStructureNode,
    getStructureViewModel,
    getVolumeNode,
    getVolumeViewModel,
    reloadMolstarAndRestoreIndex,
    removeNodeFromTree,
    replaceAssetNodeInRoot,
} from "../../../lib/molstar";
import { type MVSData_States } from "molstar/lib/extensions/mvs/mvs-data";
import { useRegimeStore } from "../../../stores/regimeStore";
import { useManagedAssetsStore } from "../../../stores/managedAssetsStore";
import {
    createDefaultComponentEntry,
    DEFAULT_STRUCTURE_VIEW_MODEL,
    DEFAULT_VOLUME_VIEW_MODEL,
    type ComponentEntry,
    type StructureViewModel,
    type VolumeViewModel,
} from "../models/MvsViewModels";

/**
 * Type of asset based on the MVS format.
 */
export type TabType = "structure" | "volume";

/**
 * Quality of the asset used for rendering. Preview refers to the (hidden) child asset created by downsampling.
 */
export type AssetQuality = "normal" | "preview";

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
                  .stateTree.snapshots.find((snap) => snap.metadata.key === viewKey)
            : null;
    }, [regime, viewKey]);

    // State to keep track which asset in the list is expanded.
    const [expandedAssetId, setExpandedAssetId] = useState<string | null>(() =>
        UiLocalStorageService.ViewBuilder.getExpandedAssetId(viewKey),
    );

    // State for all selected assets IDs in UI. These are the render asset IDs (preview child IDs when preview quality is active), matching the download URLs in the tree.
    const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>(() =>
        view ? getAllDownloadUrlsFromSnapshot(view) : [],
    );

    // State for quality overrides (parent asset ID -> chosen quality). By default the preview child is used when it exists.
    const [assetQualityOverrides, setAssetQualityOverrides] = useState<
        Record<AssetId, AssetQuality>
    >({});

    // Current record of volumeview models for each asset.
    const [volumeViewModels, setVolumeViewModels] = useState<
        Record<AssetId, VolumeViewModel>
    >({});

    // Current record of structure view models for each asset.
    const [structureViewModels, setStructureViewModels] = useState<
        Record<AssetId, StructureViewModel>
    >({});

    // Refresh UI if view changes (as result of undo/redo actions).
    const [prevView, setPrevView] = useState(view);
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
    const [selectedAssetRelativePaths, setSelectedAssetRelativePaths] = useState<
        string[]
    >(UiLocalStorageService.ViewBuilder.getAssetFolders(viewKey) ?? ["All"]);

    const [areFiltersExpanded, setAreFiltersExpanded] = useState(
        UiLocalStorageService.ViewBuilder.getExpandedFiltersSection(viewKey),
    );

    // Memoized assets filtered only by tag (local/remote) and extension (.cif/.map/...). Hidden assets (e.g. previews) are not shown.
    const assetsFilteredByType = useMemo(() => {
        const allAssets = Array.from(assets.values()).filter((asset) => !asset.hidden);

        if (selectedAssetFilters.length === 0) return [];
        if (selectedAssetFilters.includes("All")) return allAssets;

        const hasLocationFilters = selectedAssetFilters.some(
            (f) => f === "Local assets" || f === "Remote assets",
        );
        const hasExtensionFilters = selectedAssetFilters.some((f) => f.startsWith("."));

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
                    (ext) => asset.extension.toLowerCase() === ext.slice(1).toLowerCase(),
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

    // Handler for expanding the asset card.
    const toggleExpandAsset = (assetId: AssetId) => {
        const nextId = expandedAssetId === assetId ? null : assetId;
        setExpandedAssetId(nextId);
        UiLocalStorageService.ViewBuilder.setExpandedAssetId(viewKey, nextId);
    };

    /**
     * Returns the asset ID which is used everywhere in the tree and view models for given parent asset ID:
     * the preview child's ID when preview quality is active, otherwise the parent ID itself.
     * This single ID is then used for selection, view models and node building, so all of them stay consistent.
     * The only exception is export, which maps the preview child back to the full-quality parent.
     * @param parentAssetId parent asset ID
     * @returns asset ID which is used currently in the tree and view models for given parent ID
     */
    const resolveRenderAssetId = (parentAssetId: AssetId): AssetId => {
        const parentAsset = getAsset(parentAssetId);
        if (!parentAsset) {
            return parentAssetId;
        }

        const previewChildId = parentAsset.children.find(
            (child) => child.kind === "Preview",
        )?.id;

        if (!previewChildId) {
            return parentAssetId;
        }

        // Default to the preview when it exists, unless the user explicitly chose normal quality.
        const chosenQuality = assetQualityOverrides[parentAssetId];
        return chosenQuality === "normal" ? parentAssetId : previewChildId;
    };

    const getVolumeViewModelForAsset = useCallback(
        (parentAssetId: AssetId): VolumeViewModel => {
            const renderAssetId = resolveRenderAssetId(parentAssetId);

            if (volumeViewModels[renderAssetId]) {
                return volumeViewModels[renderAssetId];
            }

            const fallback: VolumeViewModel = {
                ...DEFAULT_VOLUME_VIEW_MODEL,
                format:
                    getParser(getAsset(renderAssetId)?.extension || "unknown") || "N/A",
            };

            if (!view) {
                return fallback;
            }

            return getVolumeViewModel(view.root, renderAssetId, fallback);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [volumeViewModels, getAsset, view, assetQualityOverrides, assets],
    );

    const getStructureViewModelForAsset = useCallback(
        (parentAssetId: AssetId): StructureViewModel => {
            const renderAssetId = resolveRenderAssetId(parentAssetId);

            if (structureViewModels[renderAssetId]) {
                return structureViewModels[renderAssetId];
            }

            const fallback: StructureViewModel = {
                ...DEFAULT_STRUCTURE_VIEW_MODEL,
                format:
                    getParser(getAsset(renderAssetId)?.extension || "unknown") || "N/A",
            };

            if (!view) {
                return fallback;
            }

            return getStructureViewModel(view.root, renderAssetId, fallback);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [structureViewModels, getAsset, view, assetQualityOverrides, assets],
    );

    // Function which updates volume view model and optionally sync it to Molstar.
    const updateVolumeViewModelForAsset = async (
        parentAssetId: AssetId,
        paramKey: keyof VolumeViewModel,
        val: VolumeViewModel[keyof VolumeViewModel],
        syncToMolstar: boolean,
    ) => {
        const renderAssetId = resolveRenderAssetId(parentAssetId);

        // Get updated view model .
        const updatedVm = {
            ...getVolumeViewModelForAsset(parentAssetId),
            [paramKey]: val,
        };

        // Update UI instantly.
        setVolumeViewModels((prev) => ({
            ...prev,
            [renderAssetId]: updatedVm,
        }));

        // Sync to Molstar only if requested and the asset is checked.
        if (
            syncToMolstar &&
            selectedAssetIds.includes(renderAssetId) &&
            regime.kind === "viewing"
        ) {
            const updatedTree: MVSData_States = {
                ...regime.history.current().stateTree,
                snapshots: regime.history.current().stateTree.snapshots.map((snap) => {
                    if (snap.metadata.key === viewKey) {
                        const extension = getAsset(renderAssetId)?.extension || "unknown";
                        const format =
                            getAllSupportedAssetsParsers()[extension] ?? "bcif";
                        const newNode = getVolumeNode(renderAssetId, {
                            ...updatedVm,
                            format,
                        });

                        return {
                            ...snap,
                            root: replaceAssetNodeInRoot(
                                snap.root,
                                renderAssetId,
                                newNode,
                            ),
                        };
                    }
                    return snap;
                }),
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
    const updateStructureViewModelForAsset = async (
        parentAssetId: AssetId,
        paramKey: keyof StructureViewModel,
        val: StructureViewModel[keyof StructureViewModel],
        syncToMolstar: boolean,
    ) => {
        const renderAssetId = resolveRenderAssetId(parentAssetId);

        const updatedVm = {
            ...getStructureViewModelForAsset(parentAssetId),
            [paramKey]: val,
        };

        // Update UI instantly.
        setStructureViewModels((prev) => ({
            ...prev,
            [renderAssetId]: updatedVm,
        }));

        // Sync to Molstar only if requested and the asset is checked.
        if (
            syncToMolstar &&
            selectedAssetIds.includes(renderAssetId) &&
            regime.kind === "viewing"
        ) {
            const updatedTree: MVSData_States = {
                ...regime.history.current().stateTree,
                snapshots: regime.history.current().stateTree.snapshots.map((snap) => {
                    if (snap.metadata.key === viewKey) {
                        const extension = getAsset(renderAssetId)?.extension || "unknown";
                        const format =
                            getAllSupportedAssetsParsers()[extension] ?? "bcif";
                        const newNode = getStructureNode(renderAssetId, {
                            ...updatedVm,
                            format,
                        });

                        return {
                            ...snap,
                            root: replaceAssetNodeInRoot(
                                snap.root,
                                renderAssetId,
                                newNode,
                            ),
                        };
                    }
                    return snap;
                }),
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
        parentAssetId: AssetId,
        componentId: string,
        paramKey: keyof ComponentEntry,
        val: ComponentEntry[keyof ComponentEntry],
        syncToMolstar: boolean,
    ) => {
        const renderAssetId = resolveRenderAssetId(parentAssetId);

        // Current view model.
        const currentVm = getStructureViewModelForAsset(parentAssetId);

        //  Map over components to apply the change to the specific component ID.
        const updatedComponents = currentVm.components.map((comp) =>
            comp.id === componentId ? { ...comp, [paramKey]: val } : comp,
        );

        const updatedVm: StructureViewModel = {
            ...currentVm,
            components: updatedComponents,
        };

        // Update UI.
        setStructureViewModels((prev) => ({
            ...prev,
            [renderAssetId]: updatedVm,
        }));

        // Sync to Molstar if requested and viewing conditions are met
        if (
            syncToMolstar &&
            selectedAssetIds.includes(renderAssetId) &&
            regime.kind === "viewing"
        ) {
            const updatedTree: MVSData_States = {
                ...regime.history.current().stateTree,
                snapshots: regime.history.current().stateTree.snapshots.map((snap) => {
                    if (snap.metadata.key === viewKey) {
                        const extension = getAsset(renderAssetId)?.extension || "unknown";
                        const format =
                            getAllSupportedAssetsParsers()[extension] ?? "bcif";
                        const newNode = getStructureNode(renderAssetId, {
                            ...updatedVm,
                            format,
                        });

                        return {
                            ...snap,
                            root: replaceAssetNodeInRoot(
                                snap.root,
                                renderAssetId,
                                newNode,
                            ),
                        };
                    }
                    return snap;
                }),
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

    /**
     * Function which adds a new default component to a structure asset's component
     * list and optionally syncs it to Molstar. Returns the new component's ID so
     * the caller can immediately select/expand it in the UI.
     */
    const addStructureComponentForAsset = async (
        assetId: AssetId,
        syncToMolstar: boolean,
    ): Promise<string> => {
        const currentVm = getStructureViewModelForAsset(assetId);

        // IDs are re-derived positionally by getStructureViewModel() on every
        // read from the Molstar tree (readComponentEntry always assigns
        // `component-${index}`), so a random UUID here would stop matching
        // after the next resync. Use the same positional scheme up front so
        // the active-tab lookup keeps working across the round-trip.
        const newId = `component-${currentVm.components.length}`;
        const newComponent = createDefaultComponentEntry(newId);

        await updateStructureViewModelFieldsForAsset(
            assetId,
            { components: [...currentVm.components, newComponent] },
            syncToMolstar,
        );

        return newId;
    };

    /**
     * Function which deletes a component (by ID) from a structure asset's component
     * list and optionally syncs it to Molstar. Refuses to delete the last remaining
     * component, since a structure with zero components is not valid MVS.
     */
    const deleteStructureComponentForAsset = async (
        assetId: AssetId,
        componentId: string,
        syncToMolstar: boolean,
    ) => {
        const currentVm = getStructureViewModelForAsset(assetId);

        if (currentVm.components.length <= 1) {
            pushErrorNotification(
                `Cannot delete the last remaining component of a structure!`,
            );
            return;
        }

        const updatedComponents = currentVm.components.filter(
            (comp) => comp.id !== componentId,
        );

        await updateStructureViewModelFieldsForAsset(
            assetId,
            { components: updatedComponents },
            syncToMolstar,
        );
    };

    /**
     * Function which updates MULTIPLE structure view model fields atomically and optionally syncs to Molstar.
     * Use this instead of several sequential `updateStructureViewModelForAsset` calls whenever more than one
     * field must change together (e.g. switching tooltip/label mode) - sequential single-field calls race
     * against each other (each reads the view model before the previous one's setState has landed) and can
     * silently drop all but one of the changes.
     */
    const updateStructureViewModelFieldsForAsset = async (
        parentAssetId: AssetId,
        fields: Partial<StructureViewModel>,
        syncToMolstar: boolean,
    ) => {
        const renderAssetId = resolveRenderAssetId(parentAssetId);

        const updatedVm: StructureViewModel = {
            ...getStructureViewModelForAsset(parentAssetId),
            ...fields,
        };

        setStructureViewModels((prev) => ({
            ...prev,
            [renderAssetId]: updatedVm,
        }));

        if (
            syncToMolstar &&
            selectedAssetIds.includes(renderAssetId) &&
            regime.kind === "viewing"
        ) {
            const updatedTree: MVSData_States = {
                ...regime.history.current().stateTree,
                snapshots: regime.history.current().stateTree.snapshots.map((snap) => {
                    if (snap.metadata.key === viewKey) {
                        const extension = getAsset(renderAssetId)?.extension || "unknown";
                        const format =
                            getAllSupportedAssetsParsers()[extension] ?? "bcif";
                        const newNode = getStructureNode(renderAssetId, {
                            ...updatedVm,
                            format,
                        });

                        return {
                            ...snap,
                            root: replaceAssetNodeInRoot(
                                snap.root,
                                renderAssetId,
                                newNode,
                            ),
                        };
                    }
                    return snap;
                }),
            };

            regime.commitStateTree(
                updatedTree,
                `Updated multiple fields for view "${view?.metadata.title}" (${viewKey}).`,
            );

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

    /**
     * Function which updates MULTIPLE structure's component entiry fields atomically and optionally syncs to Molstar.
     * Use this instead of several sequential `updateStructureComponentViewModel` calls whenever more than one
     * field must change together (e.g. switching tooltip/label mode) - sequential single-field calls race
     * against each other (each reads the view model before the previous one's setState has landed) and can
     * silently drop all but one of the changes.
     */
    const updateStructureComponentViewModelFields = async (
        parentAssetId: AssetId,
        componentId: string,
        fields: Partial<ComponentEntry>,
        syncToMolstar: boolean,
    ) => {
        const renderAssetId = resolveRenderAssetId(parentAssetId);

        const currentVm = getStructureViewModelForAsset(parentAssetId);
        const updatedComponents = currentVm.components.map((comp) =>
            comp.id === componentId ? { ...comp, ...fields } : comp,
        );
        const updatedVm: StructureViewModel = {
            ...currentVm,
            components: updatedComponents,
        };

        setStructureViewModels((prev) => ({
            ...prev,
            [renderAssetId]: updatedVm,
        }));

        if (
            syncToMolstar &&
            selectedAssetIds.includes(renderAssetId) &&
            regime.kind === "viewing"
        ) {
            const updatedTree: MVSData_States = {
                ...regime.history.current().stateTree,
                snapshots: regime.history.current().stateTree.snapshots.map((snap) => {
                    if (snap.metadata.key === viewKey) {
                        const extension = getAsset(renderAssetId)?.extension || "unknown";
                        const format =
                            getAllSupportedAssetsParsers()[extension] ?? "bcif";
                        const newNode = getStructureNode(renderAssetId, {
                            ...updatedVm,
                            format,
                        });

                        return {
                            ...snap,
                            root: replaceAssetNodeInRoot(
                                snap.root,
                                renderAssetId,
                                newNode,
                            ),
                        };
                    }
                    return snap;
                }),
            };

            regime.commitStateTree(
                updatedTree,
                `Updated component "${componentId}" fields for view "${view?.metadata.title}" (${viewKey}).`,
            );

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

    // Returns the currently chosen quality for given parent asset ID.
    const getAssetQuality = (parentAssetId: AssetId): AssetQuality => {
        return resolveRenderAssetId(parentAssetId) === parentAssetId
            ? "normal"
            : "preview";
    };

    // Returns true if the given parent asset is selected (its render asset ID is in the selected IDs).
    const isAssetSelected = (parentAssetId: AssetId): boolean => {
        return selectedAssetIds.includes(resolveRenderAssetId(parentAssetId));
    };

    // Handler when quality of an asset is changed. Replaces the download node of the parent asset in the tree
    // with the chosen quality (preview child or the parent itself) and reloads Molstar.
    const handleAssetQualityChange = async (
        parentAssetId: AssetId,
        quality: AssetQuality,
    ) => {
        // Which asset is currently rendered, so we know which node to replace in the tree.
        const previousRenderAssetId = resolveRenderAssetId(parentAssetId);

        // Resolve which asset should be rendered now.
        const renderAssetId =
            quality === "preview"
                ? getAsset(parentAssetId)?.children.find(
                      (child) => child.kind === "Preview",
                  )?.id ?? parentAssetId
                : parentAssetId;

        // Update the quality override.
        setAssetQualityOverrides((prev) => ({
            ...prev,
            [parentAssetId]: quality,
        }));

        // Swap the selected ID to the new render asset ID, so selection stays consistent with the tree.
        setSelectedAssetIds((prev) =>
            prev.map((id) => (id === previousRenderAssetId ? renderAssetId : id)),
        );

        // Only re-render if the asset is selected.
        if (
            !selectedAssetIds.includes(previousRenderAssetId) ||
            regime.kind !== "viewing"
        ) {
            return;
        }

        const parentAsset = getAsset(parentAssetId);
        if (!parentAsset) {
            return;
        }

        // Build the new download node with the same view model, but for the render asset.
        const extension = getAsset(renderAssetId)?.extension || "unknown";
        const format = getAllSupportedAssetsParsers()[extension] ?? "bcif";

        // Volume view model, keeping the user's adjustments.
        const volumeModel = getVolumeViewModelForAsset(parentAssetId);
        const newNode =
            parentAsset.type === "Volume"
                ? getVolumeNode(renderAssetId, { ...volumeModel, format })
                : getStructureNode(renderAssetId, {
                      ...getStructureViewModelForAsset(parentAssetId),
                      format,
                  } satisfies StructureViewModel);

        // Replace the download node in the tree.
        const updatedTree: MVSData_States = {
            ...regime.history.current().stateTree,
            snapshots: regime.history.current().stateTree.snapshots.map((snap) => {
                if (snap.metadata.key === viewKey) {
                    return {
                        ...snap,
                        root: replaceAssetNodeInRoot(
                            snap.root,
                            previousRenderAssetId,
                            newNode,
                        ),
                    };
                }
                return snap;
            }),
        };

        // Update regime.
        regime.commitStateTree(
            updatedTree,
            `Updated quality of asset "${parentAsset.name}" for view "${view?.metadata.title}" (${viewKey}).`,
        );

        // Try to reload Molstar viewer.
        const result = await reloadMolstarAndRestoreIndex(
            { key: viewKey },
            Array.from(assets.values()),
            updatedTree,
        );

        if (result instanceof Error) {
            pushErrorNotification(
                `Failed to apply quality change! For more information, check the logs.`,
            );
            loggerUi.error(result.message);
            regime.undo();
        }
    };

    // Handler when asset is toggled.
    const handleAssetToggle = async (
        toggledParentAssetId: string,
        isChecked: boolean,
        tabType: TabType,
    ) => {
        const renderAssetId = resolveRenderAssetId(toggledParentAssetId);

        // If it is checked, it means we need to add it, otherwise remove it.
        let newSelectedIds: string[];
        if (isChecked) {
            newSelectedIds = [...selectedAssetIds, renderAssetId];
        } else {
            newSelectedIds = selectedAssetIds.filter((id) => id !== renderAssetId);
        }

        // Inform managed asset manager this given asset count was increased/decreased.
        const a = getAsset(toggledParentAssetId);
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
            snapshots: regime.history.current().stateTree.snapshots.map((snap) => {
                if (snap.metadata.key === viewKey) {
                    let newRoot;

                    if (isChecked) {
                        if (tabType === "volume") {
                            // Get changes from our view model.
                            const volumeModel =
                                getVolumeViewModelForAsset(toggledParentAssetId);

                            // New root.
                            newRoot = addVolumeNodeToTree(
                                snap.root,
                                renderAssetId,
                                volumeModel,
                            );
                        } else {
                            // Get changes from our view model.
                            const volumeModel =
                                getStructureViewModelForAsset(toggledParentAssetId);

                            // New root.
                            newRoot = addStructureNodeToTree(
                                snap.root,
                                renderAssetId,
                                volumeModel,
                            );
                        }
                    } else {
                        newRoot = removeNodeFromTree(snap.root, renderAssetId);
                    }

                    return { ...snap, root: newRoot };
                }
                return snap;
            }),
        };

        // Update regime.
        regime.commitStateTree(
            updatedTree,
            `Updated asset "${toggledParentAssetId}" for view "${view?.metadata.title}" (${viewKey}).`,
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
        isAssetSelected,
        getAssetQuality,
        handleAssetQualityChange,
        expandedAssetId,
        getVolumeViewModelForAsset,
        getStructureViewModelForAsset,
        toggleExpandAsset,
        updateVolumeViewModelForAsset,
        updateStructureViewModelForAsset,
        updateStructureComponentViewModel,
        addStructureComponentForAsset,
        deleteStructureComponentForAsset,
        updateStructureViewModelFieldsForAsset,
        updateStructureComponentViewModelFields,
        handleAssetToggle,
    };
}
