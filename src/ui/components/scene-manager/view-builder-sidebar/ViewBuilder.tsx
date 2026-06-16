import { useMemo, useState, useEffect } from "react";
import { useRegime } from "../../../services/RegimeProvider";
import { SegmentedController } from "../../common/segmented-controller/SegmentedController";
import {
    Text,
    Checkbox,
    Select,
    NumberInput,
    ColorInput,
    Divider,
    Collapse,
    Group,
} from "@mantine/core";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { CloseActionIcon } from "../../common/actionables/actions/CloseActionIcon";
import { useManagedAssets } from "../../../services/ManagedAssetsProvider";
import type { MVSData_States } from "molstar/lib/extensions/mvs/mvs-data";
import {
    pushErrorNotification,
    pushWarningNotification,
} from "../../../services/NotificationService";
import { getExtensionFromFileName } from "../../../utils/fileDataUtils";
import { UiLocalStorageService } from "../../../services/UiLocalStorageService";
import { useAppearance } from "../../../services/AppearanceProvider";
import { loggerUi } from "../../../utils/loggerUi";
import {
    getAllParserTypes,
    getAllSupportedAssetsParsers,
    getAssetConfig,
    isAssetSupported,
} from "../../../domain/assetsConfig";
import {
    addDownloadNodeToRoot,
    getAllDownloadUrlsFromSnapshot,
    getVolumeParamsForAsset,
    reloadMolstarAndRestoreIndex,
    removeDownloadNodeFromRoot,
    updateNodeParamInAssetBranch,
} from "../../../../molstar-wrapper/src";

/**
 * The unified View-Model for volume parameters.
 */
interface VolumeViewModel {
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
const DEFAULT_VOLUME_VIEW_MODEL = {
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
    newRoot = updateNodeParamInAssetBranch(
        newRoot,
        assetId,
        "parse",
        "format",
        viewModel.format,
    );
    newRoot = updateNodeParamInAssetBranch(
        newRoot,
        assetId,
        "volume_representation",
        "type",
        viewModel.type,
    );
    newRoot = updateNodeParamInAssetBranch(
        newRoot,
        assetId,
        "volume_representation",
        "relative_isovalue",
        viewModel.relative_isovalue,
    );
    newRoot = updateNodeParamInAssetBranch(
        newRoot,
        assetId,
        "volume_representation",
        "show_wireframe",
        viewModel.show_wireframe,
    );
    newRoot = updateNodeParamInAssetBranch(
        newRoot,
        assetId,
        "volume_representation",
        "show_faces",
        viewModel.show_faces,
    );
    newRoot = updateNodeParamInAssetBranch(
        newRoot,
        assetId,
        "color",
        "color",
        viewModel.color,
    );
    return newRoot;
}

/**
 * Properties for ViewBuilder.
 */
interface ViewBuilderProps {
    viewKey: string;
    onClose?: () => void;
}

/**
 * View Builder component.
 */
export function ViewBuilder(props: ViewBuilderProps) {
    // Use appearance.
    const { colorScheme } = useAppearance();

    // Variable holding if dark scheme is applied.
    const isDark = colorScheme === "dark";

    // Use regime.
    const { regime, setRegime } = useRegime();

    // Use assets.
    const {
        getAllAssets,
        getAsset,
        incrementAssetUseCount,
        decrementAssetUseCount,
    } = useManagedAssets();

    // Render nothing if regime is not "viewing", or if no view was found with given key.
    if (regime.kind !== "viewing") return <></>;
    const view = regime.stateTree.snapshots.find(
        (snap) => snap.metadata.key === props.viewKey,
    );
    if (!view) return <></>;

    // State for all selected assets IDs in UI.
    const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>(
        getAllDownloadUrlsFromSnapshot(view),
    );

    // State to keep track which asset in the list is expanded.
    const [expandedAssetId, setExpandedAssetId] = useState<string | null>(
        UiLocalStorageService.ViewBuilder.getExpandedAssetId(props.viewKey),
    );

    // State to keep track which tab is opened in the expanded asset.
    type TabType = "representation" | "volume";
    const [activeTab, setActiveTab] = useState<TabType>(
        UiLocalStorageService.ViewBuilder.getTab(),
    );

    // Memoized list of all managed assets in the application.
    const assetsInView = useMemo(() => {
        return getAllAssets();
    }, [getAllAssets]);

    // Current record of volume view models for each asset.
    const [viewModels, setViewModels] = useState<
        Record<string, VolumeViewModel>
    >({});

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
    }, [assetsInView, view.root]);

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
        if (syncToMolstar && selectedAssetIds.includes(assetId)) {
            // Keep copy of original state tree.
            const originalStateTree = regime.stateTree;

            // Update source tree.
            const updatedTree: MVSData_States = {
                ...regime.stateTree,
                snapshots: regime.stateTree.snapshots.map((snap) => {
                    if (snap.metadata.key === props.viewKey) {
                        return {
                            ...snap,
                            root: applyViewModelToBranch(
                                snap.root,
                                assetId,
                                updatedVm,
                            ),
                        };
                    }
                    return snap;
                }),
            };

            // Update regime.
            setRegime({ ...regime, stateTree: updatedTree });

            // Try to reload Molstar viewer.
            const result = await reloadMolstarAndRestoreIndex(
                props.viewKey,
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

        // Create updated state tree.
        const originalStateTree = regime.stateTree;
        const updatedTree: MVSData_States = {
            ...regime.stateTree,
            snapshots: regime.stateTree.snapshots.map((snap) => {
                if (snap.metadata.key === props.viewKey) {
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
            props.viewKey,
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

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                padding: "0.5em",
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: "1em",
                }}
            >
                <div>
                    <Text size="xl" fw={520}>
                        View Builder
                    </Text>
                    <Text size="sm" c="dimmed">
                        Editing: {view.metadata.title || "untitled"}
                    </Text>
                </div>
                <CloseActionIcon
                    onClick={() => {
                        if (props.onClose) props.onClose();
                    }}
                    tooltip="Close View Builder sidebar."
                />
            </div>

            <Divider style={{ paddingBottom: "1em" }} />

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5em",
                }}
            >
                {assetsInView.map((asset) => {
                    const isExpanded = expandedAssetId === asset.id;
                    const isSelected = selectedAssetIds.includes(asset.id);

                    const viewModel = getViewModel(asset.id);

                    return (
                        <div
                            key={asset.id}
                            style={{
                                border: isDark
                                    ? "1px solid var(--mantine-color-dark-4)"
                                    : "1px solid var(--mantine-color-gray-3)",
                                borderRadius: "6px",
                                backgroundColor: isDark
                                    ? "var(--mantine-color-dark-7)"
                                    : "var(--mantine-color-white)",
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "0.75em 1em",
                                    backgroundColor: isDark
                                        ? "var(--mantine-color-dark-6)"
                                        : "var(--mantine-color-gray-0)",
                                    borderBottom: isExpanded
                                        ? isDark
                                            ? "1px solid var(--mantine-color-dark-4)"
                                            : "1px solid var(--mantine-color-gray-2)"
                                        : "none",
                                    cursor: "pointer",
                                }}
                                onClick={() => {
                                    setExpandedAssetId(
                                        isExpanded ? null : asset.id,
                                    );
                                    UiLocalStorageService.ViewBuilder.setExpandedAssetId(
                                        props.viewKey,
                                        isExpanded ? null : asset.id,
                                    );
                                }}
                            >
                                <div
                                    style={{
                                        flex: 1,
                                        fontWeight: 500,
                                        fontSize: "0.9em",
                                        wordBreak: "break-all",
                                    }}
                                >
                                    <Text
                                        size="xs"
                                        c="dimmed"
                                        tt="uppercase"
                                        fw={700}
                                    >
                                        {asset.tag}
                                    </Text>
                                    {asset.name}
                                </div>
                                <Checkbox
                                    checked={isSelected}
                                    disabled={!isAssetSupported(asset.name)}
                                    onChange={(e) => {
                                        handleAssetToggle(
                                            asset.id,
                                            e.currentTarget.checked,
                                        );
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    mr="sm"
                                />
                                {isExpanded ? (
                                    <IconChevronUp size={16} />
                                ) : (
                                    <IconChevronDown size={16} />
                                )}
                            </div>

                            <Collapse
                                expanded={
                                    isExpanded && isAssetSupported(asset.name)
                                }
                            >
                                <div
                                    style={{
                                        padding: "1em",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "1em",
                                    }}
                                >
                                    <SegmentedController<TabType>
                                        value={activeTab}
                                        onChange={(tab) => {
                                            setActiveTab(tab);
                                            UiLocalStorageService.ViewBuilder.setTab(
                                                tab,
                                            );
                                        }}
                                        data={[
                                            {
                                                label: "Representation",
                                                value: "representation",
                                            },
                                            {
                                                label: "Volume",
                                                value: "volume",
                                            },
                                        ]}
                                        widthWrapOrientationLimit={200}
                                    />

                                    {activeTab === "representation" && (
                                        <Text
                                            size="sm"
                                            c="dimmed"
                                            ta="center"
                                            py="xl"
                                        >
                                            Representation options coming
                                            soon...
                                        </Text>
                                    )}

                                    {activeTab === "volume" && (
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "1em",
                                                marginTop: "0.5em",
                                            }}
                                        >
                                            <Select
                                                label="Format"
                                                disabled={true}
                                                data={getAllParserTypes()}
                                                value={viewModel.format}
                                                placeholder="N/A"
                                                size="xs"
                                            />
                                            <Select
                                                label="Type"
                                                data={[
                                                    "isosurface",
                                                    "grid_slice",
                                                ]}
                                                value={viewModel.type}
                                                onChange={(val) => {
                                                    if (val === "grid_slice") {
                                                        pushWarningNotification(
                                                            "The volume type of 'grid_slice' is not supported at the moment!",
                                                        );
                                                    } else if (val) {
                                                        updateViewModel(
                                                            asset.id,
                                                            "type",
                                                            val,
                                                            true,
                                                        );
                                                    }
                                                }}
                                                size="xs"
                                            />
                                            <NumberInput
                                                label="Relative isosurface"
                                                value={
                                                    viewModel.relative_isovalue
                                                }
                                                onChange={(val) => {
                                                    if (
                                                        typeof val === "number"
                                                    ) {
                                                        updateViewModel(
                                                            asset.id,
                                                            "relative_isovalue",
                                                            val,
                                                            false,
                                                        );
                                                    }
                                                }}
                                                onBlur={() =>
                                                    updateViewModel(
                                                        asset.id,
                                                        "relative_isovalue",
                                                        viewModel.relative_isovalue,
                                                        true,
                                                    )
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        updateViewModel(
                                                            asset.id,
                                                            "relative_isovalue",
                                                            viewModel.relative_isovalue,
                                                            true,
                                                        );
                                                        e.currentTarget.blur();
                                                    }
                                                }}
                                                step={0.1}
                                                size="xs"
                                            />
                                            <Group mt="xs">
                                                <Checkbox
                                                    label="Show wireframe"
                                                    size="xs"
                                                    checked={
                                                        viewModel.show_wireframe
                                                    }
                                                    onChange={(e) =>
                                                        updateViewModel(
                                                            asset.id,
                                                            "show_wireframe",
                                                            e.currentTarget
                                                                .checked,
                                                            true,
                                                        )
                                                    }
                                                />
                                                <Checkbox
                                                    label="Show faces"
                                                    size="xs"
                                                    checked={
                                                        viewModel.show_faces
                                                    }
                                                    onChange={(e) =>
                                                        updateViewModel(
                                                            asset.id,
                                                            "show_faces",
                                                            e.currentTarget
                                                                .checked,
                                                            true,
                                                        )
                                                    }
                                                />
                                            </Group>
                                            <ColorInput
                                                label="Color"
                                                value={viewModel.color}
                                                onChange={(val) =>
                                                    updateViewModel(
                                                        asset.id,
                                                        "color",
                                                        val,
                                                        false,
                                                    )
                                                }
                                                onChangeEnd={(val) =>
                                                    updateViewModel(
                                                        asset.id,
                                                        "color",
                                                        val,
                                                        true,
                                                    )
                                                }
                                                size="xs"
                                                format="hex"
                                            />
                                        </div>
                                    )}
                                </div>
                            </Collapse>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
