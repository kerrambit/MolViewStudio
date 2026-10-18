/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useState } from "react";
import { Collapse, Divider, Group, Select, Text, Textarea } from "@mantine/core";
import {
    getDownsamplingStrategyOptions,
    type DownsamplingStrategy,
    type SerializerKind,
    type ProcessVolumeRequestWithoutFilepathsAndBundlingApproach,
} from "../../../../config/processingDefinitions";
import { IconHelpOctagonFilled } from "@tabler/icons-react";
import { UnstyledTextInput } from "../../../../components/common/input/UnstyledTextInput";
import { useAppearance } from "../../../../hooks/useAppearance";
import { useEnvironment } from "../../../../hooks/useEnvironment";
import { CollapseTrigger } from "../../../../components/common/collapse-trigger/CollapseTriger";
import { Button } from "../../../../components/common/button/Button";
import { useExportSettings } from "../../../settings/hooks/useExportSettings";
import { useRegimeStore } from "../../../../stores/regimeStore";
import {
    getResolutionLevelOptions,
    type ResolutionLevel,
} from "../../../processing/resolution/domain/ResolutionLevel";
import {
    DOWNSAMPLING_LEVEL_TO_STRATEGY,
    getDownsamplingLevelOptions,
    type DownsamplingLevel,
} from "../../../processing/downsampling/config/DownsamplingLevel";

/**
 * Result of the export processing properties dialogue.
 */
export interface ExportDialogueResultType {
    /**
     * Processing properties sent to the processing server.
     */
    properties: ProcessVolumeRequestWithoutFilepathsAndBundlingApproach;

    /**
     * Folder where the final export output is saved.
     */
    outputPath: string;

    /**
     * Filename of the final export.
     */
    filename: string;

    /**
     * Resolution level of the processed volume embedded into the story export.
     */
    targetResolution: ResolutionLevel;
}

interface ExportDialogueContentProps {
    /**
     * Local assets of type `Volume` which will be processed.
     */
    volumeAssets: ManagedAsset[];

    /**
     * Local assets of type `Segmentation` which will be processed.
     */
    segmentationAssets: ManagedAsset[];

    close: (value?: ExportDialogueResultType) => void;
}

export function ExportDialogueContent({
    volumeAssets,
    segmentationAssets,
    close,
}: ExportDialogueContentProps) {
    // Use apperance.
    const { colorScheme } = useAppearance();

    // Use environment.
    const { userDataPath } = useEnvironment();

    // Use export settings.
    const {
        currentExportSettings: { showAdvancedExportOptions },
    } = useExportSettings();

    // Simple downsampling level state.
    const [downsamplingLevel, setDownsamplingLevel] =
        useState<DownsamplingLevel>("medium");
    const downsamplingLevelOptions = getDownsamplingLevelOptions();

    // Advanced states.
    const [isAdvancedExpanded, setAdvancedExpanded] = useState(false);
    const [advancedStrategy, setAdvancedStrategy] =
        useState<DownsamplingStrategy>("tricubic");
    const downsamplingStrategyOptions = getDownsamplingStrategyOptions();

    // Resolution of the processed volume embedded into the story export.
    const [targetResolution, setTargetResolution] = useState<ResolutionLevel>("high");
    const resolutionLevelOptions = getResolutionLevelOptions();

    // Output folder state, defaults to the user's Exports folder.
    const [outputPath, setOutputPath] = useState<string>(`${userDataPath}/Exports`);

    // Expanded states.
    const [isVolumeExpanded, setVolumeExpanded] = useState(true);
    const [isSegmentationExpanded, setSegmentationExpanded] = useState(false);

    // The effective downsampling strategy: the advanced strategy overrides the simple level once touched.
    const effectiveDownsamplingStrategy = isAdvancedExpanded
        ? advancedStrategy
        : DOWNSAMPLING_LEVEL_TO_STRATEGY[downsamplingLevel];

    // Names of the assets to be processed, used in the summary text.
    const volumeAssetsNames = volumeAssets.map((asset) => `"${asset.name}"`).join(", ");
    const segmentationAssetsNames = segmentationAssets
        .map((asset) => `"${asset.name}"`)
        .join(", ");

    // Story title.
    const regime = useRegimeStore((state) => state.regime);
    if (regime.kind !== "viewing") {
        return null;
    }
    const [filename, setFilename] = useState<string | undefined>(
        regime.history.current().stateTree.metadata.title ?? "export",
    );

    // Generate summary text based on current options.
    const summaryText =
        (volumeAssets.length === 0
            ? ""
            : `The volume source${
                  volumeAssets.length > 1 ? "s" : ""
              } ${volumeAssetsNames} will be downsampled using the "${effectiveDownsamplingStrategy}" strategy, serialized into the "mrc" format and the "${targetResolution}" resolution version will be embedded into the story export.\n\n`) +
        (segmentationAssets.length > 0
            ? `The segmentation source${
                  segmentationAssets.length > 1 ? "s" : ""
              } ${segmentationAssetsNames} will be serialized into the "mrc" format.\n\n`
            : "") +
        `The output will be bundled into MVSX archive, ready to be opened directly in the viewer.` +
        `\n\nThe export will be saved into "${outputPath}/${filename}.mvsx".`;

    // Render the component.
    return (
        <div>
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
                        flex: 1.35,
                        gap: "1em",
                    }}
                >
                    {/* Volume block. */}
                    {volumeAssets.length > 0 && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
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
                                        gap: ".25em",
                                        paddingTop: ".5em",
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
                                            style={{ minWidth: "1em" }}
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
                                        label="Downsampling quality:"
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

                                    {showAdvancedExportOptions && (
                                        <Select
                                            label="Volume resolution:"
                                            data={resolutionLevelOptions}
                                            value={targetResolution}
                                            allowDeselect={false}
                                            onChange={(value) =>
                                                setTargetResolution(
                                                    value as ResolutionLevel,
                                                )
                                            }
                                            placeholder="Select a resolution..."
                                            size="sm"
                                            comboboxProps={{
                                                withinPortal: true,
                                                zIndex: 10000,
                                            }}
                                            style={{
                                                paddingBottom: ".75em",
                                            }}
                                        />
                                    )}

                                    {/* Advanced options. */}
                                    {showAdvancedExportOptions && (
                                        <CollapseTrigger
                                            title={"Advanced options"}
                                            titleTextSize="sm"
                                            expanded={isAdvancedExpanded}
                                            onClick={() => {
                                                setAdvancedExpanded((prev) => !prev);
                                            }}
                                        />
                                    )}

                                    {showAdvancedExportOptions && (
                                        <Collapse expanded={isAdvancedExpanded}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: ".25em",
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
                                            </div>
                                        </Collapse>
                                    )}
                                </div>
                            </Collapse>
                        </div>
                    )}

                    {/* Segmentation block. */}
                    {segmentationAssets.length > 0 && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
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
                                        gap: ".25em",
                                        paddingTop: ".5em",
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
                                            style={{ minWidth: "1em" }}
                                        >
                                            Segmentation sources:
                                        </Text>
                                        <UnstyledTextInput
                                            value={segmentationAssetsNames}
                                            enabled={false}
                                            style={{ flexGrow: 1 }}
                                        />
                                    </div>
                                </div>
                            </Collapse>
                        </div>
                    )}

                    {/* Output block. */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: ".25em",
                        }}
                    >
                        <Text size="lg">Output</Text>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "1em",
                            }}
                        >
                            <Text size="sm" fw={600} style={{ minWidth: "1em" }}>
                                Output folder:
                            </Text>
                            <UnstyledTextInput
                                value={outputPath}
                                tooltip={outputPath}
                                enabled={false}
                                style={{ flexGrow: 1 }}
                            />
                            <Button
                                variant="ghost"
                                size="small"
                                onClick={async () => {
                                    const selected =
                                        await window.electron.selectDirectory(outputPath);
                                    if (selected instanceof Error) {
                                        return;
                                    }
                                    if (selected) {
                                        setOutputPath(selected);
                                    }
                                }}
                            >
                                Browse...
                            </Button>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "1em",
                            }}
                        >
                            <Text size="sm" fw={600} style={{ minWidth: "1em" }}>
                                Filename:
                            </Text>
                            <UnstyledTextInput
                                value={filename}
                                tooltip={filename}
                                enabled={true}
                                onBlur={(value) => {
                                    if (value) {
                                        setFilename(value);
                                    } else {
                                        setFilename("");
                                    }
                                }}
                                onValueChange={(value) => {
                                    if (value) {
                                        setFilename(value);
                                    } else {
                                        setFilename("");
                                    }
                                }}
                                canBeEmpty={false}
                                style={{ flexGrow: 1 }}
                            />
                        </div>
                    </div>
                </div>

                {/* Right column. */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        gap: "0.5em",
                    }}
                >
                    <Group gap="xs" justify="space-between" align="center">
                        <Text size="sm" fw={600}>
                            Summary
                        </Text>
                        <IconHelpOctagonFilled
                            style={{
                                opacity: 0.6,
                                cursor: "help",
                            }}
                            title={`This dialogue sets properties for the current export.\nInitial settings can be changed in the Settings.`}
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
                <Button variant="secondary" size="small" onClick={() => close(undefined)}>
                    Close
                </Button>
                <Button
                    variant="primary"
                    size="small"
                    disabled={!filename}
                    onClick={() => {
                        close({
                            properties: {
                                downsampling_strategy: effectiveDownsamplingStrategy,
                                volume_serializer: "mrc" as SerializerKind,
                                segmentation_mask_serializer: "mrc" as SerializerKind,
                                segmentation_volume_serializer: "mrc" as SerializerKind,
                                segmentation_mesh_serializer: "mrc" as SerializerKind,
                            } as ProcessVolumeRequestWithoutFilepathsAndBundlingApproach,
                            outputPath: outputPath,
                            filename: filename?.trim() ?? "export",
                            targetResolution: targetResolution,
                        });
                    }}
                >
                    Start processing
                </Button>
            </Group>
        </div>
    );
}
