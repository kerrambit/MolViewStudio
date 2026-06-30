import { useState } from "react";
import {
    Text,
    Checkbox,
    Collapse,
    Select,
    NumberInput,
    Group,
    ColorInput,
    AlphaSlider,
    Divider,
} from "@mantine/core";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { SegmentedController } from "../../../../../components/common/segmented-controller/SegmentedController";
import { UiLocalStorageService } from "../../../../../services/UiLocalStorageService";
import {
    getAllParserTypes,
    isExtensionSupported,
} from "../../../../../config/assetsDefinitions";
import { pushWarningNotification } from "../../../../../services/NotificationService";
import type { VolumeViewModel } from "../../../hooks/useViewBuilder";
import { CollapseTrigger } from "../../../../../components/common/collapse-trigger/CollapseTriger";
import { TransformControls } from "./TransformControls";

type TabType = "representation" | "volume";

interface AssetBuilderCardProps {
    viewKey: string;
    asset: ManagedAsset;
    isDark: boolean;
    isExpanded: boolean;
    isSelected: boolean;
    viewModel: VolumeViewModel;
    onToggleExpand: () => void;
    onToggleSelect: (checked: boolean) => void;
    onUpdateParam: (
        key: keyof VolumeViewModel,
        val: any,
        sync: boolean,
    ) => void;
}

export function AssetBuilderCard({
    viewKey,
    asset,
    isDark,
    isExpanded,
    isSelected,
    viewModel,
    onToggleExpand,
    onToggleSelect,
    onUpdateParam,
}: AssetBuilderCardProps) {
    // Store active tab.
    const [activeTab, setActiveTab] = useState<TabType>(() =>
        UiLocalStorageService.ViewBuilder.getTab(asset.id, viewKey),
    );

    // Store expanded secttions.
    const [generalSectionExpanded, setGeneralSectionExpanded] = useState(
        UiLocalStorageService.ViewBuilder.getExpandedGeneralSection(
            asset.id,
            viewKey,
        ),
    );
    const [transformSectionExpanded, setTransformSectionExpanded] = useState(
        UiLocalStorageService.ViewBuilder.getExpandedTransformSection(
            asset.id,
            viewKey,
        ),
    );

    // Checks if the given asset checked is supported or not.
    const isSupported = isExtensionSupported(asset.extension);

    // Render the component.
    return (
        <div
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
                    borderBottom:
                        isExpanded && isSupported
                            ? isDark
                                ? "1px solid var(--mantine-color-dark-4)"
                                : "1px solid var(--mantine-color-gray-2)"
                            : "none",
                    cursor: "pointer",
                }}
                onClick={onToggleExpand}
            >
                <div
                    style={{
                        flex: 1,
                        fontWeight: 500,
                        fontSize: "0.9em",
                        wordBreak: "break-all",
                    }}
                >
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                        {asset.tag}
                    </Text>
                    {asset.relativePath}
                </div>
                <Checkbox
                    title={
                        !isSupported
                            ? asset.extension === "unknown"
                                ? `Extension is unknown, go to Assets to check and edit the asset!`
                                : `This extension is not supported!`
                            : ""
                    }
                    checked={isSelected}
                    disabled={!isSupported}
                    onChange={(e) => onToggleSelect(e.currentTarget.checked)}
                    onClick={(e) => e.stopPropagation()}
                    mr="sm"
                />
                {isExpanded ? (
                    <IconChevronUp size={16} />
                ) : (
                    <IconChevronDown size={16} />
                )}
            </div>

            <Collapse expanded={isExpanded && isSupported}>
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
                                asset.id,
                                viewKey,
                                tab,
                            );
                        }}
                        data={[
                            {
                                label: "Representation",
                                value: "representation",
                            },
                            { label: "Volume", value: "volume" },
                        ]}
                        widthWrapOrientationLimit={200}
                    />

                    {activeTab === "representation" && (
                        <Text size="sm" c="dimmed" ta="center" py="xl">
                            Representation options coming soon...
                        </Text>
                    )}

                    {activeTab === "volume" && (
                        <div>
                            {/* General settings for volume tab. */}
                            <CollapseTrigger
                                title={"General"}
                                size={"md"}
                                expanded={generalSectionExpanded}
                                onClick={() => {
                                    setGeneralSectionExpanded((prev) => {
                                        const nextState = !prev;
                                        UiLocalStorageService.ViewBuilder.setExpandedGeneralSection(
                                            asset.id,
                                            viewKey,
                                            nextState,
                                        );
                                        return nextState;
                                    });
                                }}
                            ></CollapseTrigger>

                            <Collapse expanded={generalSectionExpanded}>
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "1em",
                                        paddingBottom: "1em",
                                    }}
                                >
                                    <Select
                                        label="Format"
                                        disabled
                                        data={getAllParserTypes()}
                                        value={viewModel.format}
                                        placeholder="N/A"
                                        size="xs"
                                    />
                                    <Select
                                        label="Type"
                                        data={["isosurface", "grid_slice"]}
                                        value={viewModel.type}
                                        onChange={(val) => {
                                            if (val === "grid_slice") {
                                                pushWarningNotification(
                                                    "The volume type of 'grid_slice' is not supported at the moment!",
                                                );
                                            } else if (val) {
                                                onUpdateParam(
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
                                        value={viewModel.relative_isovalue}
                                        step={0.1}
                                        size="xs"
                                        onChange={(val) =>
                                            typeof val === "number" &&
                                            onUpdateParam(
                                                "relative_isovalue",
                                                val,
                                                false,
                                            )
                                        }
                                        onBlur={() =>
                                            onUpdateParam(
                                                "relative_isovalue",
                                                viewModel.relative_isovalue,
                                                true,
                                            )
                                        }
                                        onKeyDown={(e) =>
                                            e.key === "Enter" &&
                                            onUpdateParam(
                                                "relative_isovalue",
                                                viewModel.relative_isovalue,
                                                true,
                                            )
                                        }
                                    />
                                    <Group mt="xs">
                                        <Checkbox
                                            label="Show wireframe"
                                            size="xs"
                                            checked={viewModel.show_wireframe}
                                            onChange={(e) =>
                                                onUpdateParam(
                                                    "show_wireframe",
                                                    e.currentTarget.checked,
                                                    true,
                                                )
                                            }
                                        />
                                        <Checkbox
                                            label="Show faces"
                                            size="xs"
                                            checked={viewModel.show_faces}
                                            onChange={(e) =>
                                                onUpdateParam(
                                                    "show_faces",
                                                    e.currentTarget.checked,
                                                    true,
                                                )
                                            }
                                        />
                                    </Group>
                                    <ColorInput
                                        label="Color"
                                        value={viewModel.color}
                                        size="xs"
                                        format="hex"
                                        onChange={(val) =>
                                            onUpdateParam("color", val, false)
                                        }
                                        onChangeEnd={(val) =>
                                            onUpdateParam("color", val, true)
                                        }
                                    />
                                    <AlphaSlider
                                        color={viewModel.color}
                                        value={viewModel.opacity}
                                        onChange={(val) =>
                                            onUpdateParam("opacity", val, false)
                                        }
                                        onChangeEnd={(val) =>
                                            onUpdateParam("opacity", val, true)
                                        }
                                    ></AlphaSlider>

                                    <Divider mb="md" />
                                </div>
                            </Collapse>

                            {/* Transform settings for volume tab. */}
                            <CollapseTrigger
                                title={"Transform"}
                                size={"md"}
                                expanded={transformSectionExpanded}
                                onClick={() => {
                                    setTransformSectionExpanded((prev) => {
                                        const nextState = !prev;
                                        UiLocalStorageService.ViewBuilder.setExpandedTransformSection(
                                            asset.id,
                                            viewKey,
                                            nextState,
                                        );
                                        return nextState;
                                    });
                                }}
                            ></CollapseTrigger>

                            <Collapse expanded={transformSectionExpanded}>
                                <TransformControls
                                    viewModel={viewModel}
                                    onUpdateParam={onUpdateParam}
                                ></TransformControls>
                            </Collapse>
                        </div>
                    )}
                </div>
            </Collapse>
        </div>
    );
}
