/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useState } from "react";
import { Collapse, Divider, Group, Select, Text, Textarea } from "@mantine/core";
import {
    getBundlingKindOptions,
    getDownsamplingLevelOptions,
    getDownsamplingStrategyOptions,
    DOWNSAMPLING_LEVEL_TO_STRATEGY,
    type BundlingKind,
    type DownsamplingLevel,
    type DownsamplingStrategy,
    type ProcessVolumeRequestWithoutFilepaths,
    type SerializerKind,
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

/**
 * Result of the export processing properties dialogue.
 */
export interface ExportDialogueResultType {
    /**
     * Processing properties sent to the processing server.
     */
    properties: ProcessVolumeRequestWithoutFilepaths;

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

    // Bundling strategy state, MVSX is the default.
    const [bundlingStrategy, setBundlingStrategy] = useState<BundlingKind>("mvsx");
    const bundlingOptions = getBundlingKindOptions();

    // Resolution of the processed volume embedded into the story export.
    const [targetResolution, setTargetResolution] = useState<ResolutionLevel>("high");
    const resolutionLevelOptions = getResolutionLevelOptions();

    // Output folder state, defaults to the user's Exports folder.
    const [outputPath, setOutputPath] = useState<string>(`${userDataPath}/Exports`);

    // Expanded states.
    const [isVolumeExpanded, setVolumeExpanded] = useState(false);
    const [isSegmentationExpanded, setSegmentationExpanded] = useState(false);
    const [isBundlingExpanded, setBundlingExpanded] = useState(false);
    const [isOutputExpanded, setOutputExpanded] = useState(true);

    // The effective downsampling strategy: the advanced strategy overrides the simple level once touched.
    const effectiveDownsamplingStrategy = isAdvancedExpanded
        ? advancedStrategy
        : DOWNSAMPLING_LEVEL_TO_STRATEGY[downsamplingLevel];

    // Names of the assets to be processed, used in the summary text.
    const volumeAssetsNames = volumeAssets.map((asset) => `"${asset.name}"`).join(", ");
    const segmentationAssetsNames = segmentationAssets
        .map((asset) => `"${asset.name}"`)
        .join(", ");

    // Generate summary text based on current options.
    const summaryText =
        (volumeAssets.length === 0
            ? `No volume sources to processing were found.\n\n`
            : `The volume source${
                  volumeAssets.length > 1 ? "s" : ""
              } ${volumeAssetsNames} will be downsampled using the "${effectiveDownsamplingStrategy}" strategy, serialized into the "mrc" format and the "${targetResolution}" resolution version will be embedded into the story export.\n\n`) +
        (segmentationAssets.length > 0
            ? `The segmentation source${
                  segmentationAssets.length > 1 ? "s" : ""
              } ${segmentationAssetsNames} will be serialized into the "mrc" format.\n\n`
            : `No segmentation sources for processing were found.\n\n`) +
        (bundlingStrategy === "mvsx"
            ? `The output will be bundled into MVSX archive(s), ready to be opened directly in the viewer.`
            : bundlingStrategy === "null"
            ? `The output will be kept as raw serialized files, without any bundling. This allows you to easily add individual files to different views and work with them directly after processing.`
            : `The output will be bundled into ${
                  bundlingStrategy === "zip"
                      ? "a ZIP archive"
                      : "ZIP archives per resolution"
              }. Note that archived files cannot be added into views directly after processing.`) +
        `\n\nThe export will be saved into "${outputPath}".`;

    // Story title..
    const regime = useRegimeStore((state) => state.regime);
    if (regime.kind !== "viewing") {
        return null;
    }
    const [filename, setFilename] = useState<string | undefined>(
        regime.history.current().stateTree.metadata.title ?? "export",
    );

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
                    {volumeAssets.length > 0 && (
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
                                            </div>
                                        </Collapse>
                                    )}
                                    <Divider mt="sm" />
                                </div>
                            </Collapse>
                        </div>
                    )}

                    {/* Segmentation block. */}
                    {segmentationAssets.length > 0 && (
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
                                <Divider mt="sm" />
                            </Collapse>
                        </div>
                    )}

                    {/* Bundling block. */}
                    {showAdvancedExportOptions && (
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
                                            setBundlingStrategy(value as BundlingKind)
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
                    )}

                    {/* Output block. */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <CollapseTrigger
                            title={"Output"}
                            titleTextSize="lg"
                            expanded={isOutputExpanded}
                            onClick={() => {
                                setOutputExpanded((prev) => !prev);
                            }}
                        />

                        <Collapse expanded={isOutputExpanded}>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: ".25em",
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
                                                await window.electron.selectDirectory(
                                                    outputPath,
                                                );
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
                                        Name:
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
                    disabled={!filename}
                    onClick={() => {
                        close({
                            properties: {
                                downsampling_strategy: effectiveDownsamplingStrategy,
                                volume_serializer: "mrc" as SerializerKind,
                                segmentation_mask_serializer: "mrc" as SerializerKind,
                                segmentation_volume_serializer: "mrc" as SerializerKind,
                                segmentation_mesh_serializer: "mrc" as SerializerKind,
                                bundling_approach: bundlingStrategy,
                            } as ProcessVolumeRequestWithoutFilepaths,
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
