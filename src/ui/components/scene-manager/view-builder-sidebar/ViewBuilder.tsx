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

interface ViewBuilderProps {
    viewKey: string;
    onClose?: () => void;
}

export function ViewBuilder(props: ViewBuilderProps) {
    const { regime } = useRegime();
    const { getAllAssets } = useManagedAssets();

    // 1. STATE FOR ACCORDION (Which one is visually expanded)
    const [expandedAssetId, setExpandedAssetId] = useState<string | null>(
        "asset-1",
    );

    // 2. NEW STATE FOR SELECTION (Which one is checked)
    // You can initialize this to null, or default it to the first asset in the list.
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

    type TabType = "representation" | "volume";
    const [activeTab, setActiveTab] = useState<TabType>("representation");

    if (regime.kind !== "viewing") return <></>;

    const view = regime.stateTree.snapshots.find(
        (snap) => snap.metadata.key === props.viewKey,
    );
    if (!view) return <></>;

    const assetsInView = useMemo(() => {
        return getAllAssets();
    }, [getAllAssets]);

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
                    // Check if THIS asset is the currently selected one
                    const isSelected = selectedAssetId === asset.id;

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
                                    // Make the checkbox fully controlled by our state
                                    checked={isSelected}
                                    onChange={(_) => {
                                        // If clicked, set it as the selected asset.
                                        // Optional: if you want them to be able to UN-check it entirely,
                                        // you could do: setSelectedAssetId(e.currentTarget.checked ? asset.id : null)
                                        setSelectedAssetId(asset.id);
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
