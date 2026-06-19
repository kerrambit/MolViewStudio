import { useEffect, useMemo, useState } from "react";
import { useRegime } from "../../../providers/RegimeProvider";
import { useManagedAssets } from "../../../providers/ManagedAssetsProvider";
import { UiLocalStorageService } from "../../../services/UiLocalStorageService";
import { pushErrorNotification } from "../../../services/NotificationService";
import { loggerUi } from "../../../services/UiLoggingService";
import { getExtensionFromFileName } from "../../../utils/fileDataUtils";
import {
    getAssetConfig,
    getAllSupportedAssetsParsers,
} from "../../../config/assetsDefinitions";
import {
    getAllDownloadUrlsFromSnapshot,
    getVolumeParamsForAsset,
    updateNodeParamInAssetBranch,
    reloadMolstarAndRestoreIndex,
    addDownloadNodeToRoot,
    removeDownloadNodeFromRoot,
} from "../../../lib/molstar";
import type { MVSData_States } from "molstar/lib/extensions/mvs/mvs-data";

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
    color: "#36bd97",
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
    root: any,
    assetId: string,
    viewModel: VolumeViewModel,
) {
    let newRoot = root;
    const params = [
        { node: "parse", key: "format", val: viewModel.format },
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
    return newRoot;
}

export function useViewBuilder(viewKey: string) {
    // Use regime.
    const { regime, setRegime } = useRegime();

    // Use managed assets.
    const {
        getAllAssets,
        getAsset,
        incrementAssetUseCount,
        decrementAssetUseCount,
    } = useManagedAssets();

    // Memoized view.
    const view = useMemo(() => {
        return regime.kind === "viewing"
            ? regime.stateTree.snapshots.find(
                  (snap) => snap.metadata.key === viewKey,
              )
            : null;
    }, [regime, viewKey]);

    // State for all selected assets IDs in UI.
    const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>(() =>
        view ? getAllDownloadUrlsFromSnapshot(view) : [],
    );

    // State to keep track which asset in the list is expanded.
    const [expandedAssetId, setExpandedAssetId] = useState<string | null>(() =>
        UiLocalStorageService.ViewBuilder.getExpandedAssetId(viewKey),
    );

    // Current record of volume view models for each asset.
    const [viewModels, setViewModels] = useState<
        Record<string, VolumeViewModel>
    >({});

    // Memoized list of all managed assets in the application.
    const assetsInView = useMemo(() => getAllAssets(), [getAllAssets]);

    // Function which returns safe view model based on asset ID.
    const getViewModel = (assetId: string): VolumeViewModel => {
        return (
            viewModels[assetId] || {
                ...DEFAULT_VOLUME_VIEW_MODEL,
                format:
                    getAssetConfig(getAsset(assetId)?.name || "")?.parser ||
                    "N/A",
            }
        );
    };

    // Initialize View-Models from Molstar on first load or when new assets appear.
    useEffect(() => {
        if (!view) return;

        const initialModels: Record<string, VolumeViewModel> = {};
        assetsInView.forEach((asset) => {
            if (!viewModels[asset.id]) {
                initialModels[asset.id] = getVolumeParamsForAsset(
                    view.root,
                    asset.id,
                    {
                        ...DEFAULT_VOLUME_VIEW_MODEL,
                        format: getAssetConfig(asset.name)?.parser || "N/A",
                    },
                ) as VolumeViewModel;
            }
        });
        if (Object.keys(initialModels).length > 0) {
            setViewModels((prev) => ({ ...prev, ...initialModels }));
        }
    }, [assetsInView, view]);

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
        val: any,
        syncToMolstar: boolean,
    ) => {
        const updatedVm = { ...viewModels[assetId], [paramKey]: val };

        // Update UI instantly.
        setViewModels((prev) => ({ ...prev, [assetId]: updatedVm }));

        // Sync to Molstar only if requested and the asset is checked.
        if (
            syncToMolstar &&
            selectedAssetIds.includes(assetId) &&
            regime.kind === "viewing"
        ) {
            // Keep copy of original state tree.
            const originalStateTree = regime.stateTree;

            // Update source tree.
            const updatedTree: MVSData_States = {
                ...regime.stateTree,
                snapshots: regime.stateTree.snapshots.map((snap) =>
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
            setRegime({ ...regime, stateTree: updatedTree });

            // Try to reload Molstar viewer.
            const result = await reloadMolstarAndRestoreIndex(
                viewKey,
                getAllAssets(),
                updatedTree,
            );
            if (result instanceof Error) {
                pushErrorNotification(
                    `Failed to apply changes! For more information, check the logs.`,
                );
                loggerUi.error(result.message);

                // TODO: implement a global Undo stack, you would just call `undo()` here instead of manually reverting
                setRegime({ ...regime, stateTree: originalStateTree });
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
        const originalStateTree = regime.stateTree;
        const updatedTree: MVSData_States = {
            ...regime.stateTree,
            snapshots: regime.stateTree.snapshots.map((snap) => {
                if (snap.metadata.key === viewKey) {
                    let newRoot = snap.root;

                    if (isChecked) {
                        // Get changes from our view model.
                        const draftedParams = getViewModel(toggledAssetId);

                        // New root.
                        newRoot = addDownloadNodeToRoot(
                            snap.root,
                            toggledAssetId,
                            getExtensionFromFileName(
                                getAsset(toggledAssetId)?.name || "",
                            ) || "",
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
        setRegime({
            ...regime,
            stateTree: updatedTree,
        });

        // Try to reload Molstar viewer.
        const result = await reloadMolstarAndRestoreIndex(
            viewKey,
            getAllAssets(),
            updatedTree,
        );

        if (result instanceof Error) {
            pushErrorNotification(
                `Failed to apply changes! It is possible that given asset cannot be used in the MVS. For more information, check the logs.`,
            );
            loggerUi.error(result.message);

            // TODO: implement a global Undo stack, you would just call `undo()` here instead of manually reverting
            if (a) {
                if (isChecked) {
                    decrementAssetUseCount(a.asset.url);
                } else {
                    incrementAssetUseCount(a.asset.url);
                }
            }

            setSelectedAssetIds(selectedAssetIds);

            setRegime({
                ...regime,
                stateTree: originalStateTree,
            });
        }
    };

    return {
        view,
        assetsInView,
        selectedAssetIds,
        expandedAssetId,
        getViewModel,
        toggleExpandAsset,
        updateViewModel,
        handleAssetToggle,
    };
}
