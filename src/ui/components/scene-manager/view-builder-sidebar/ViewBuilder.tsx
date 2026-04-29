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
} from "../../../../molstar-wrapper/src";
import type { MVSData_States } from "molstar/lib/extensions/mvs/mvs-data";
import { pushErrorNotification } from "../../../services/NotificationService";

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

    // Use managed assets.
    const { getAllAssets } = useManagedAssets();

    // If regime is not viewing or if the provided key does not match with any view, do not render anything.
    if (regime.kind !== "viewing") return <></>;
    const view = regime.stateTree.snapshots.find(
        (snap) => snap.metadata.key === props.viewKey,
    );
    if (!view) return <></>;

    // Array of currently used asset IDs.
    const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>(
        getAllDownloadUrlsFromSnapshot(view),
    );

    // ID of the asset currently visually expanded.
    const [expandedAssetId, setExpandedAssetId] = useState<string | null>(
        selectedAssetIds.sort().length > 0 ? selectedAssetIds[0] : null,
    );

    // Currently active tab for visually expanded asset.
    type TabType = "representation" | "volume";
    const [activeTab, setActiveTab] = useState<TabType>("representation");

    // Memoized list of all loaded assets in the app.
    const assetsInView = useMemo(() => {
        return getAllAssets();
    }, [getAllAssets]);

    // Async function to handle asset toggle.
    const handleAssetToggle = async (
        toggledAssetId: string,
        isChecked: boolean,
    ) => {
        // Update local array state.
        let newSelectedIds: string[];
        if (isChecked) {
            newSelectedIds = [...selectedAssetIds, toggledAssetId];
        } else {
            newSelectedIds = selectedAssetIds.filter(
                (id) => id !== toggledAssetId,
            );
        }
        setSelectedAssetIds(newSelectedIds);

        // Update the state tree.
        const updatedTree: MVSData_States = {
            ...regime.stateTree,
            snapshots: regime.stateTree.snapshots.map((snap) => {
                if (snap.metadata.key === props.viewKey) {
                    return {
                        ...snap,
                        root: isChecked
                            ? addAssetToRoot(snap.root, toggledAssetId)
                            : removeAssetFromRoot(snap.root, toggledAssetId),
                    };
                }
                return snap;
            }),
        };

        setRegime({
            ...regime,
            stateTree: updatedTree,
        });

        // Rerender in Molstar.
        const renderTree = buildRenderTreeForMolstar(
            updatedTree,
            getAllAssets(),
        );

        const result = await loadMVSIntoMolstar(renderTree);
        if (!result.success) {
            pushErrorNotification(`${result.error}`);
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
                                                    "gaussian-surface",
                                                    "surface",
                                                ]}
                                                defaultValue="isosurface"
                                                size="xs"
                                            />
                                            <NumberInput
                                                label="Relative isosurface"
                                                defaultValue={1.5}
                                                step={0.1}
                                                size="xs"
                                            />
                                            <Group mt="xs">
                                                <Checkbox
                                                    label="Show wireframe"
                                                    size="xs"
                                                    defaultChecked
                                                />
                                                <Checkbox
                                                    label="Show faces"
                                                    size="xs"
                                                    defaultChecked
                                                />
                                            </Group>
                                            <ColorInput
                                                label="Color"
                                                defaultValue="#00805c"
                                                size="xs"
                                                format="hex"
                                                swatches={[
                                                    "#2e2e2e",
                                                    "#868e96",
                                                    "#fa5252",
                                                    "#e64980",
                                                    "#be4bdb",
                                                    "#7950f2",
                                                    "#4c6ef5",
                                                    "#228be6",
                                                    "#15aabf",
                                                    "#12b886",
                                                    "#40c057",
                                                    "#82c91e",
                                                    "#fab005",
                                                    "#fd7e14",
                                                ]}
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
