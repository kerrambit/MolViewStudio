/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useState } from "react";
import { Text, Checkbox, Collapse } from "@mantine/core";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { SegmentedController } from "../../../../../components/common/segmented-controller/SegmentedController";
import { UiLocalStorageService } from "../../../../../services/UiLocalStorageService";
import { isExtensionSupported } from "../../../../../config/assetsDefinitions";
import type { VolumeViewModel } from "../../../hooks/useViewBuilder";
import { VolumeTab } from "./VolumeTab";

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                        <VolumeTab
                            viewKey={viewKey}
                            asset={asset}
                            viewModel={viewModel}
                            onUpdateParam={onUpdateParam}
                        ></VolumeTab>
                    )}
                </div>
            </Collapse>
        </div>
    );
}
