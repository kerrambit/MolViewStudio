import { useMemo, useState } from "react";
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
import { CloseActionIcon } from "../../common/actionable-list-item/actions/CloseActionIcon";
import { useManagedAssets } from "../../../services/ManagedAssetsProvider";
import {
    buildRenderTreeForMolstar,
    getAllDownloadUrlsFromSnapshot,
    removeAssetFromRoot,
    addAssetToRoot,
    loadMVSIntoMolstar,
    updateNodeParamInAssetBranch,
    getVolumeParamsForAsset,
    applySnapshotByIndex,
} from "../../../../molstar-wrapper/src";
import type { MVSData_States } from "molstar/lib/extensions/mvs/mvs-data";
import {
    pushErrorNotification,
    pushWarningNotification,
} from "../../../services/NotificationService";
import { getExtensionFromFileName } from "../../../utils/fileDataUtils";

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
    // Use regime.
    const { regime, setRegime } = useRegime();

    // Use assets.
    const { getAllAssets, incrementAssetUseCount, decrementAssetUseCount } =
        useManagedAssets();

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
    const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);

    // State to keep track which tab is opened in the expanded asset.
    type TabType = "representation" | "volume";
    const [activeTab, setActiveTab] = useState<TabType>("representation");

    // Memoized list of all managed assets in the application.
    const assetsInView = useMemo(() => {
        return getAllAssets();
    }, [getAllAssets]);

    const reloadMolstarAndRestoreIndex = async (
        updatedTree: MVSData_States,
    ) => {
        // Build and load the tree.
        const renderTree = buildRenderTreeForMolstar(
            updatedTree,
            getAllAssets(),
        );
        const result = await loadMVSIntoMolstar(renderTree);

        if (!result.success) {
            pushErrorNotification(result.error.message);
            return;
        }

        // Find the index of the view we are currently editing.
        const currentIndex = updatedTree.snapshots.findIndex(
            (snap) => snap.metadata.key === props.viewKey,
        );

        // Immediately force Molstar back to that index.
        if (currentIndex !== -1) {
            await applySnapshotByIndex(currentIndex);
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
        const a = getAllAssets().find((a) => a.id === toggledAssetId);
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
        const updatedTree: MVSData_States = {
            ...regime.stateTree,
            snapshots: regime.stateTree.snapshots.map((snap) => {
                if (snap.metadata.key === props.viewKey) {
                    return {
                        ...snap,
                        root: isChecked
                            ? addAssetToRoot(
                                  snap.root,
                                  toggledAssetId,
                                  getExtensionFromFileName(
                                      getAllAssets().find(
                                          (a) => a.id === toggledAssetId,
                                      )?.name,
                                  ),
                              )
                            : removeAssetFromRoot(snap.root, toggledAssetId),
                    };
                }
                return snap;
            }),
        };

        // Update regime.
        setRegime({
            ...regime,
            stateTree: updatedTree,
        });

        // Now we need only to rerender the tree in Molstar viewer. We need to replace managed assets IDs with their acrp url counterparts.
        await reloadMolstarAndRestoreIndex(updatedTree);
    };

    const handleNodeParamChange = async (
        assetId: string,
        nodeKind: string,
        paramKey: string,
        newValue: any,
    ) => {
        if (regime.kind !== "viewing") return;

        // Create updated state tree.
        const updatedTree: MVSData_States = {
            ...regime.stateTree,
            snapshots: regime.stateTree.snapshots.map((snap) => {
                if (snap.metadata.key === props.viewKey) {
                    return {
                        ...snap,
                        root: updateNodeParamInAssetBranch(
                            snap.root,
                            assetId,
                            nodeKind, // E.g. "volume_representation" or "color"
                            paramKey,
                            newValue,
                        ),
                    };
                }
                return snap;
            }),
        };

        // Update regime.
        setRegime({
            ...regime,
            stateTree: updatedTree,
        });

        // Now we need only to rerender the tree in Molstar viewer. We need to replace managed assets IDs with their acrp url counterparts.
        await reloadMolstarAndRestoreIndex(updatedTree);
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

                    const currentParams = getVolumeParamsForAsset(
                        view.root,
                        asset.id,
                    );

                    return (
                        <div
                            key={asset.id}
                            style={{
                                border: "1px solid var(--mantine-color-gray-3)",
                                borderRadius: "6px",
                                backgroundColor: "var(--mantine-color-white)",
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "0.75em 1em",
                                    backgroundColor:
                                        "var(--mantine-color-gray-0)",
                                    borderBottom: isExpanded
                                        ? "1px solid var(--mantine-color-gray-2)"
                                        : "none",
                                    cursor: "pointer",
                                }}
                                onClick={() => {
                                    setExpandedAssetId(
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

                            <Collapse in={isExpanded}>
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
                                        onChange={setActiveTab}
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
                                                label="Type"
                                                data={[
                                                    "isosurface",
                                                    "grid_slice",
                                                ]}
                                                value={currentParams.type}
                                                onChange={(val) => {
                                                    if (val === "grid_slice") {
                                                        pushWarningNotification(
                                                            "The volume type of 'grid_slice' is not supported at the moment!",
                                                        );
                                                    } else if (val) {
                                                        handleNodeParamChange(
                                                            asset.id,
                                                            "volume_representation",
                                                            "type",
                                                            val,
                                                        );
                                                    }
                                                }}
                                                size="xs"
                                            />
                                            <NumberInput
                                                label="Relative isosurface"
                                                defaultValue={
                                                    currentParams.relative_isovalue
                                                }
                                                onBlur={(e) => {
                                                    const val = parseFloat(
                                                        e.currentTarget.value,
                                                    );
                                                    if (!isNaN(val)) {
                                                        handleNodeParamChange(
                                                            asset.id,
                                                            "volume_representation",
                                                            "relative_isovalue",
                                                            val,
                                                        );
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        const val = parseFloat(
                                                            e.currentTarget
                                                                .value,
                                                        );
                                                        if (!isNaN(val)) {
                                                            handleNodeParamChange(
                                                                asset.id,
                                                                "volume_representation",
                                                                "relative_isovalue",
                                                                val,
                                                            );
                                                        }
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
                                                        currentParams.show_wireframe
                                                    }
                                                    onChange={(e) => {
                                                        handleNodeParamChange(
                                                            asset.id,
                                                            "volume_representation",
                                                            "show_wireframe",
                                                            e.currentTarget
                                                                .checked,
                                                        );
                                                    }}
                                                />
                                                <Checkbox
                                                    label="Show faces"
                                                    size="xs"
                                                    checked={
                                                        currentParams.show_faces
                                                    }
                                                    onChange={(e) => {
                                                        handleNodeParamChange(
                                                            asset.id,
                                                            "volume_representation",
                                                            "show_faces",
                                                            e.currentTarget
                                                                .checked,
                                                        );
                                                    }}
                                                />
                                            </Group>
                                            <ColorInput
                                                label="Color"
                                                defaultValue={
                                                    currentParams.color
                                                }
                                                size="xs"
                                                format="hex"
                                                onChangeEnd={(val) => {
                                                    handleNodeParamChange(
                                                        asset.id,
                                                        "color",
                                                        "color",
                                                        val,
                                                    );
                                                }}
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
