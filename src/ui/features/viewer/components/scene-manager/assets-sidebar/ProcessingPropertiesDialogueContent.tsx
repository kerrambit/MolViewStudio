/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useState } from "react";
import { Collapse, Group, Select, Text, Textarea } from "@mantine/core";
import {
    getBundlingKindOptions,
    getDownsamplingLevelOptions,
    getDownsamplingStrategyOptions,
    getSerializerKindOptions,
    DOWNSAMPLING_LEVEL_TO_STRATEGY,
    type BundlingKind,
    type DownsamplingLevel,
    type DownsamplingStrategy,
    type ProcessVolumeRequestWithoutFilepaths,
    type SerializerKind,
} from "../../../../../config/processingDefinitions";
import { IconHelpOctagonFilled } from "@tabler/icons-react";
import { UnstyledTextInput } from "../../../../../components/common/input/UnstyledTextInput";
import { useAppearance } from "../../../../../hooks/useAppearance";
import { CollapseTrigger } from "../../../../../components/common/collapse-trigger/CollapseTriger";
import { Button } from "../../../../../components/common/button/Button";

interface ProcessingPropertiesDialogueContentProps {
    /**
     * Local assets of type `Volume` which will be processed.
     */
    volumeAssets: ManagedAsset[];

    /**
     * Local assets of type `Segmentation` which will be processed.
     */
    segmentationAssets: ManagedAsset[];

    close: (value?: ProcessVolumeRequestWithoutFilepaths) => void;
}

export function ProcessingPropertiesDialogueContent({
    volumeAssets,
    segmentationAssets,
    close,
}: ProcessingPropertiesDialogueContentProps) {
    // Use apperance.
    const { colorScheme } = useAppearance();

    // Simple downsampling level state.
    const [downsamplingLevel, setDownsamplingLevel] =
        useState<DownsamplingLevel>("medium");
    const downsamplingLevelOptions = getDownsamplingLevelOptions();

    // Advanced states.
    const [advancedStrategy, setAdvancedStrategy] =
        useState<DownsamplingStrategy>("trilinear");
    const downsamplingStrategyOptions = getDownsamplingStrategyOptions();

    const [isAdvancedExpanded, setAdvancedExpanded] = useState(false);

    // Volume serializer state.
    const [volumeSerializer, setVolumeSerializer] =
        useState<SerializerKind>("mrc");
    const serializerOptions = getSerializerKindOptions();

    // Segmentation serializer states.
    const [segmentationMaskSerializer, setSegmentationMaskSerializer] =
        useState<SerializerKind>("mrc");
    const [segmentationVolumeSerializer, setSegmentationVolumeSerializer] =
        useState<SerializerKind>("mrc");
    const [segmentationMeshSerializer, setSegmentationMeshSerializer] =
        useState<SerializerKind>("mrc");

    // Bundling strategy state, MVSX is the default.
    const [bundlingStrategy, setBundlingStrategy] =
        useState<BundlingKind>("mvsx");
    const bundlingOptions = getBundlingKindOptions();

    // Expanded states.
    const [isVolumeExpanded, setVolumeExpanded] = useState(true);
    const [isSegmentationExpanded, setSegmentationExpanded] = useState(true);
    const [isBundlingExpanded, setBundlingExpanded] = useState(false);

    // The effective downsampling strategy: the advanced strategy overrides the simple level once touched.
    const effectiveDownsamplingStrategy = isAdvancedExpanded
        ? advancedStrategy
        : DOWNSAMPLING_LEVEL_TO_STRATEGY[downsamplingLevel];

    // Names of the assets to be processed, used in the summary text.
    const volumeAssetsNames = volumeAssets
        .map((asset) => `"${asset.name}"`)
        .join(", ");
    const segmentationAssetsNames = segmentationAssets
        .map((asset) => `"${asset.name}"`)
        .join(", ");

    // Generate summary text based on current options.
    const summaryText =
        (volumeAssets.length === 0
            ? `No volume sources will be processed.\n\n`
            : `The volume source${
                  volumeAssets.length > 1 ? "s" : ""
              } ${volumeAssetsNames} will be downsampled using the "${effectiveDownsamplingStrategy}" strategy and serialized into the "${volumeSerializer}" format.\n\n`) +
        (segmentationAssets.length === 0
            ? `No segmentation sources will be processed.\n\n`
            : `The segmentation source${
                  segmentationAssets.length > 1 ? "s" : ""
              } ${segmentationAssetsNames} will be serialized into the "${segmentationVolumeSerializer}" (volume), "${segmentationMaskSerializer}" (mask) and "${segmentationMeshSerializer}" (mesh) formats.\n\n`) +
        (bundlingStrategy === "mvsx"
            ? `The output will be bundled into MVSX archive(s), ready to be opened directly in the viewer.`
            : bundlingStrategy === "null"
            ? `The output will be kept as raw serialized files, without any bundling. This allows you to easily add individual files to different views and work with them directly after processing.`
            : `The output will be bundled into ${
                  bundlingStrategy === "zip"
                      ? "a ZIP archive"
                      : "ZIP archives per resolution"
              }. Note that archived files cannot be added into views directly after processing.`);

    // Render the component.
    return (
        <div>
            {/* Header. */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "end",
                    alignItems: "center",
                    marginBottom: "0.5em",
                }}
            ></div>

            {/* Main body. */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: "2em",
                }}
            >
                {/* Left column. */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        gap: "1em",
                    }}
                >
                    {/* Volume block. */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <CollapseTrigger
                            title={"Volume"}
                            titleTextSize="lg"
                            expanded={isVolumeExpanded}
                            onClick={() => {
                                setVolumeExpanded((prev) => !prev);
                            }}
                        />

                        <Collapse expanded={isVolumeExpanded}>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "1em",
                                    padding: "0.5em 0 0 0",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "1em",
                                    }}
                                >
                                    <Text
                                        size="sm"
                                        fw={600}
                                        style={{ minWidth: "9em" }}
                                    >
                                        Volume sources:
                                    </Text>
                                    <UnstyledTextInput
                                        value={volumeAssetsNames}
                                        enabled={false}
                                        style={{ flexGrow: 1 }}
                                    />
                                </div>

                                <Select
                                    label="Downsampling:"
                                    data={downsamplingLevelOptions}
                                    value={downsamplingLevel}
                                    allowDeselect={false}
                                    onChange={(value) =>
                                        setDownsamplingLevel(
                                            value as DownsamplingLevel,
                                        )
                                    }
                                    placeholder="Select downsampling..."
                                    size="sm"
                                    comboboxProps={{
                                        withinPortal: true,
                                        zIndex: 10000,
                                    }}
                                />

                                {/* Advanced options. */}
                                <CollapseTrigger
                                    title={"Advanced options"}
                                    titleTextSize="sm"
                                    expanded={isAdvancedExpanded}
                                    onClick={() => {
                                        setAdvancedExpanded((prev) => !prev);
                                    }}
                                />

                                <Collapse expanded={isAdvancedExpanded}>
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "1em",
                                        }}
                                    >
                                        <Select
                                            label="Downsampling strategy:"
                                            data={downsamplingStrategyOptions}
                                            value={advancedStrategy}
                                            allowDeselect={false}
                                            onChange={(value) =>
                                                setAdvancedStrategy(
                                                    value as DownsamplingStrategy,
                                                )
                                            }
                                            placeholder="Select a strategy..."
                                            size="sm"
                                            comboboxProps={{
                                                withinPortal: true,
                                                zIndex: 10000,
                                            }}
                                        />

                                        <Select
                                            label="Volume serialization:"
                                            data={serializerOptions}
                                            value={volumeSerializer}
                                            allowDeselect={false}
                                            onChange={(value) =>
                                                setVolumeSerializer(
                                                    value as SerializerKind,
                                                )
                                            }
                                            placeholder="Select a volume serializer..."
                                            size="sm"
                                            comboboxProps={{
                                                withinPortal: true,
                                                zIndex: 10000,
                                            }}
                                        />
                                    </div>
                                </Collapse>
                            </div>
                        </Collapse>
                    </div>

                    {/* Segmentation block. */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <CollapseTrigger
                            title={"Segmentation"}
                            titleTextSize="lg"
                            expanded={isSegmentationExpanded}
                            onClick={() => {
                                setSegmentationExpanded((prev) => !prev);
                            }}
                        />

                        <Collapse expanded={isSegmentationExpanded}>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "1em",
                                    padding: "0.5em 0 0 0",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "1em",
                                    }}
                                >
                                    <Text
                                        size="sm"
                                        fw={600}
                                        style={{ minWidth: "9em" }}
                                    >
                                        Segmentation sources:
                                    </Text>
                                    <UnstyledTextInput
                                        value={segmentationAssetsNames}
                                        enabled={false}
                                        style={{ flexGrow: 1 }}
                                    />
                                </div>

                                <Select
                                    label="Segmentation volume serialization:"
                                    data={serializerOptions}
                                    value={segmentationVolumeSerializer}
                                    allowDeselect={false}
                                    onChange={(value) =>
                                        setSegmentationVolumeSerializer(
                                            value as SerializerKind,
                                        )
                                    }
                                    placeholder="Select a serializer..."
                                    size="sm"
                                    comboboxProps={{
                                        withinPortal: true,
                                        zIndex: 10000,
                                    }}
                                />

                                <Select
                                    label="Segmentation mask serialization:"
                                    data={serializerOptions}
                                    value={segmentationMaskSerializer}
                                    allowDeselect={false}
                                    onChange={(value) =>
                                        setSegmentationMaskSerializer(
                                            value as SerializerKind,
                                        )
                                    }
                                    placeholder="Select a serializer..."
                                    size="sm"
                                    comboboxProps={{
                                        withinPortal: true,
                                        zIndex: 10000,
                                    }}
                                />

                                <Select
                                    label="Segmentation mesh serialization:"
                                    data={serializerOptions}
                                    value={segmentationMeshSerializer}
                                    allowDeselect={false}
                                    onChange={(value) =>
                                        setSegmentationMeshSerializer(
                                            value as SerializerKind,
                                        )
                                    }
                                    placeholder="Select a serializer..."
                                    size="sm"
                                    comboboxProps={{
                                        withinPortal: true,
                                        zIndex: 10000,
                                    }}
                                />
                            </div>
                        </Collapse>
                    </div>

                    {/* Bundling block. */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <CollapseTrigger
                            title={"Bundling"}
                            titleTextSize="lg"
                            expanded={isBundlingExpanded}
                            onClick={() => {
                                setBundlingExpanded((prev) => !prev);
                            }}
                        />

                        <Collapse expanded={isBundlingExpanded}>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "1em",
                                    padding: "0.5em 0 0 0",
                                }}
                            >
                                <Select
                                    label="Bundling:"
                                    data={bundlingOptions}
                                    value={bundlingStrategy}
                                    allowDeselect={false}
                                    onChange={(value) =>
                                        setBundlingStrategy(
                                            value as BundlingKind,
                                        )
                                    }
                                    placeholder="Select a bundling strategy..."
                                    size="sm"
                                    comboboxProps={{
                                        withinPortal: true,
                                        zIndex: 10000,
                                    }}
                                />
                            </div>
                        </Collapse>
                    </div>
                </div>

                {/* Right column. */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        minHeight: "10em",
                        gap: "0.5em",
                    }}
                >
                    <Group gap="xs" justify="space-between" align="center">
                        <Text size="sm" fw={700}>
                            Summary
                        </Text>
                        <IconHelpOctagonFilled
                            style={{
                                opacity: 0.6,
                                cursor: "help",
                            }}
                            title={`This dialogue sets properties for the current processing.\nInitial settings can be changed in the Settings.\n\nNote: Settings page is not implemented yet, the only way to set properties for now is this dialogue!`}
                        />
                    </Group>

                    <Textarea
                        value={summaryText}
                        readOnly
                        styles={{
                            root: { height: "100%" },
                            wrapper: { height: "100%" },
                            input: {
                                height: "100%",
                                borderRadius: "6px",
                                backgroundColor:
                                    colorScheme === "dark"
                                        ? "var(--color-dark-ui-component-mantine)"
                                        : "var(--color-light-ui-component-mantine)",
                                color: "var(--input-color)",
                                border: "none",
                            },
                        }}
                        style={{ height: "100%" }}
                    />
                </div>
            </div>

            {/* Actions. */}
            <Group justify="center" mt="xl">
                <Button
                    variant="secondary"
                    size="medium"
                    onClick={() => close(undefined)}
                >
                    Close
                </Button>
                <Button
                    variant="primary"
                    size="medium"
                    disabled={
                        volumeAssets.length === 0 &&
                        segmentationAssets.length === 0
                    }
                    onClick={() => {
                        close({
                            downsampling_strategy:
                                effectiveDownsamplingStrategy,
                            volume_serializer: volumeSerializer,
                            segmentation_mask_serializer:
                                segmentationMaskSerializer,
                            segmentation_volume_serializer:
                                segmentationVolumeSerializer,
                            segmentation_mesh_serializer:
                                segmentationMeshSerializer,
                            bundling_approach: bundlingStrategy,
                        } as ProcessVolumeRequestWithoutFilepaths);
                    }}
                >
                    Start processing
                </Button>
            </Group>
        </div>
    );
}
