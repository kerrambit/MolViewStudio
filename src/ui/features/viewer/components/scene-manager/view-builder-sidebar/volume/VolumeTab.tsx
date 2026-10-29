/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useState } from "react";
import {
    AlphaSlider,
    Checkbox,
    Collapse,
    ColorInput,
    Group,
    NumberInput,
    Select,
    TextInput,
} from "@mantine/core";
import type { VolumeViewModel } from "../../../../models/MvsViewModels";
import { CollapseTrigger } from "../../../../../../components/common/collapse-trigger/CollapseTriger";
import { getAllParserTypes } from "../../../../../assets/domain/assetsDefinitions";
import { UiLocalStorageService } from "../../../../../persistence/services/UiLocalStorageService";
import { AssetBuilderCardSectionGroup } from "../AssetBuilderCardSectionGroup";
import { VolumeTransformControls } from "./VolumeTransformControls";
import { TransferFunctionSection } from "./TransferFunctionSection";

type VolumeTabProps = {
    viewKey: string;
    asset: ManagedAsset;
    renderAssetId: string;
    viewModel: VolumeViewModel;
    onUpdateParam: (
        key: keyof VolumeViewModel,
        val: VolumeViewModel[keyof VolumeViewModel],
        sync: boolean,
    ) => void;
};

export function VolumeTab({
    viewKey,
    asset,
    renderAssetId,
    viewModel,
    onUpdateParam,
}: VolumeTabProps) {
    // Store expanded sections.
    const [generalSectionExpanded, setGeneralSectionExpanded] = useState(
        UiLocalStorageService.ViewBuilder.getExpandedVolumeGeneralSection(
            asset.id,
            viewKey,
        ),
    );
    const [representationSectionExpanded, setRepresentationSectionExpanded] = useState(
        UiLocalStorageService.ViewBuilder.getExpandedVolumeRepresentationSection(
            asset.id,
            viewKey,
        ),
    );
    const [transformSectionExpanded, setTransformSectionExpanded] = useState(
        UiLocalStorageService.ViewBuilder.getExpandedVolumeTransformSection(
            asset.id,
            viewKey,
        ),
    );

    // Direct volume (transfer function) rendering has its own section and
    // hides the isosurface-specific controls.
    const isDirectVolume = viewModel.type === "direct_volume";

    // Render the component.
    return (
        <AssetBuilderCardSectionGroup divider={false}>
            {/* General settings for volume tab. */}
            <CollapseTrigger
                title={"General"}
                titleTextSize={"md"}
                expanded={generalSectionExpanded}
                onClick={() => {
                    setGeneralSectionExpanded((prev) => {
                        const nextState = !prev;
                        UiLocalStorageService.ViewBuilder.setExpandedVolumeGeneralSection(
                            asset.id,
                            viewKey,
                            nextState,
                        );
                        return nextState;
                    });
                }}
            ></CollapseTrigger>

            <Collapse expanded={generalSectionExpanded}>
                <AssetBuilderCardSectionGroup
                    divider={true}
                    topMargin="sm"
                    bottomMargin="sm"
                >
                    <Select
                        label="Format"
                        disabled
                        data={getAllParserTypes()}
                        value={viewModel.format}
                        placeholder="N/A"
                        size="xs"
                    />
                    <TextInput
                        label={"Channel ID"}
                        value={viewModel.channel_id || undefined}
                        placeholder="No channel ID assigned."
                        size="xs"
                        onChange={(e) =>
                            onUpdateParam("channel_id", e.currentTarget.value, false)
                        }
                        onBlur={() =>
                            onUpdateParam("channel_id", viewModel.channel_id, true)
                        }
                        onKeyDown={(e) =>
                            e.key === "Enter" &&
                            onUpdateParam("channel_id", viewModel.channel_id, true)
                        }
                    />
                    <Select
                        label="Type"
                        data={["isosurface", "direct_volume"]}
                        value={viewModel.type}
                        onChange={(val) => {
                            if (val) {
                                onUpdateParam("type", val, true);
                            }
                        }}
                        size="xs"
                    />
                    {!isDirectVolume && (
                        <NumberInput
                            label="Relative isosurface"
                            value={viewModel.relative_isovalue}
                            step={0.1}
                            size="xs"
                            onChange={(val) =>
                                typeof val === "number" &&
                                onUpdateParam("relative_isovalue", val, false)
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
                    )}
                </AssetBuilderCardSectionGroup>
            </Collapse>

            {/* Representation settings for volume tab. Direct volume rendering
                is fully controlled by the transfer function (colors and alpha
                both live there), so the whole section is hidden for it. */}
            {!isDirectVolume && (
                <>
                    <CollapseTrigger
                        title={"Representation"}
                        titleTextSize={"md"}
                        expanded={representationSectionExpanded}
                        onClick={() => {
                            setRepresentationSectionExpanded((prev) => {
                                const nextState = !prev;
                                UiLocalStorageService.ViewBuilder.setExpandedVolumeRepresentationSection(
                                    asset.id,
                                    viewKey,
                                    nextState,
                                );
                                return nextState;
                            });
                        }}
                    ></CollapseTrigger>

                    <Collapse expanded={representationSectionExpanded}>
                        <AssetBuilderCardSectionGroup
                            divider={true}
                            topMargin="sm"
                            bottomMargin="sm"
                        >
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
                                onChange={(val) => onUpdateParam("color", val, false)}
                                onChangeEnd={(val) => onUpdateParam("color", val, true)}
                            />
                            <AlphaSlider
                                color={viewModel.color}
                                value={viewModel.opacity}
                                onChange={(val) => onUpdateParam("opacity", val, false)}
                                onChangeEnd={(val) => onUpdateParam("opacity", val, true)}
                            ></AlphaSlider>
                        </AssetBuilderCardSectionGroup>
                    </Collapse>
                </>
            )}

            {/* Transfer function settings for direct volume tab. */}
            {isDirectVolume && (
                <TransferFunctionSection
                    viewKey={viewKey}
                    assetId={asset.id}
                    renderAssetId={renderAssetId}
                    viewModel={viewModel}
                    onUpdateParam={onUpdateParam}
                ></TransferFunctionSection>
            )}

            {/* Transform settings for volume tab. */}
            <CollapseTrigger
                title={"Transform"}
                titleTextSize={"md"}
                expanded={transformSectionExpanded}
                onClick={() => {
                    setTransformSectionExpanded((prev) => {
                        const nextState = !prev;
                        UiLocalStorageService.ViewBuilder.setExpandedVolumeTransformSection(
                            asset.id,
                            viewKey,
                            nextState,
                        );
                        return nextState;
                    });
                }}
            ></CollapseTrigger>

            <Collapse expanded={transformSectionExpanded}>
                <VolumeTransformControls
                    viewModel={viewModel}
                    onUpdateParam={onUpdateParam}
                ></VolumeTransformControls>
            </Collapse>
        </AssetBuilderCardSectionGroup>
    );
}
