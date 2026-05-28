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
import { CloseActionIcon } from "../../common/actionables/actions/CloseActionIcon";
import { useManagedAssets } from "../../../services/ManagedAssetsProvider";
import {
    getAllDownloadUrlsFromSnapshot,
    removeAssetFromRoot,
    addAssetToRoot,
    updateNodeParamInAssetBranch,
    getVolumeParamsForAsset,
    reloadMolstarAndRestoreIndex,
} from "../../../../molstar-wrapper/src";
import type { MVSData_States } from "molstar/lib/extensions/mvs/mvs-data";
import { pushWarningNotification } from "../../../services/NotificationService";
import { getExtensionFromFileName } from "../../../utils/fileDataUtils";
import { UiLocalStorageService } from "../../../services/UiLocalStorageService";
import { useAppearance } from "../../../services/AppearanceProvider";

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
        const allAssets = getAllAssets();
        const a = allAssets.find((a) => a.id === toggledAssetId);
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
        await reloadMolstarAndRestoreIndex(
            props.viewKey,
            allAssets,
            updatedTree,
        );
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
                            nodeKind,
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
        await reloadMolstarAndRestoreIndex(
            props.viewKey,
            getAllAssets(),
            updatedTree,
        );
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

                            <Collapse expanded={isExpanded}>
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
