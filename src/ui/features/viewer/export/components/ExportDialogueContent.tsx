/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useState } from "react";
import { Collapse, Group, List, Select, Text, Checkbox } from "@mantine/core";
import { IconFileDescription, IconHelpCircle } from "@tabler/icons-react";
import { UnstyledTextInput } from "../../../../components/common/input/UnstyledTextInput";
import { useEnvironment } from "../../../../hooks/useEnvironment";
import { CollapseTrigger } from "../../../../components/common/collapse-trigger/CollapseTriger";
import { CollapsibleBlock } from "../../../../components/common/collapsible-block/CollapsibleBlock";
import { Button } from "../../../../components/common/button/Button";
import { useExportSettings } from "../../../settings/hooks/useExportSettings";
import { useProcessingSettings } from "../../../settings/hooks/useProcessingSettings";
import { resolveExportProcessingSettings } from "../../../settings/domain/resolveProcessingSettings";
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
import {
    getDownsamplingStrategyOptions,
    type DownsamplingStrategy,
} from "../../../processing/downsampling/config/DownsamplingStrategy";
import type { SerializerKind } from "../../../processing/serializer/config/SerializerKind";
import { WarningMessage } from "../../../../components/common/messages/WarningMessage";
import { UiLocalStorageService } from "../../../../services/UiLocalStorageService";
import { FileOverrideWarningMessage } from "./FileOverrideWarningMessage";
import type { ProcessVolumeRequestWithoutFilepathsAndBundlingApproach } from "../../../processing/api/volume/ProcessVolumeRequest";

/**
 * Result of the export processing properties dialogue.
 */
export interface ExportDialogueResultType {
    /**
     * Processing properties sent to the processing server.
     */
    // TODO: code smell, we do not want to use directly api request, create facade object
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
    // Use environment.
    const { userDataPath } = useEnvironment();

    // Use export settings.
    const {
        currentExportSettings: {
            showAdvancedExportOptions,
            bundleAllLocalAssets,
            processAllLocalAssets,
        },
    } = useExportSettings();

    // Use processing settings.
    const { getProcessignSettings } = useProcessingSettings();

    // Use regime (story title is used as the default filename).
    const regime = useRegimeStore((state) => state.regime);

    // Extensions of all assets processed by the export. When they all share a single
    // extension, the per-format settings of that extension are used, otherwise the global ones.
    const effectiveExportProcessing = resolveExportProcessingSettings(
        getProcessignSettings(),
        [...volumeAssets, ...segmentationAssets].map((asset) => asset.extension),
    );

    // Downsampling toggle state (used without advanced export options).
    // It starts unchecked if the loaded setting is "null".
    const [enableDownsampling, setEnableDownsampling] = useState(
        effectiveExportProcessing.downsamplingMethod !== "null",
    );

    // Check if the configured downsampling method maps to a simple "quality" level
    // If not (e.g. "smoothing"), we will show the full strategy select even in simple mode
    const [isStrategySimple] = useState<boolean>(() =>
        (Object.values(DOWNSAMPLING_LEVEL_TO_STRATEGY) as string[]).includes(
            effectiveExportProcessing.downsamplingMethod,
        ),
    );

    // Simple downsampling level state (used without advanced export options),
    // derived from the effective strategy when it maps to one of the simple levels.
    const initialDownsamplingLevel =
        (Object.keys(DOWNSAMPLING_LEVEL_TO_STRATEGY) as DownsamplingLevel[]).find(
            (level) =>
                DOWNSAMPLING_LEVEL_TO_STRATEGY[level] ===
                effectiveExportProcessing.downsamplingMethod,
        ) ?? "medium";
    const [downsamplingLevel, setDownsamplingLevel] = useState<DownsamplingLevel>(
        initialDownsamplingLevel,
    );
    const downsamplingLevelOptions = getDownsamplingLevelOptions();

    // Downsampling strategy state (used with advanced export options or when isStrategySimple is false).
    const [downsamplingStrategy, setDownsamplingStrategy] =
        useState<DownsamplingStrategy>(effectiveExportProcessing.downsamplingMethod);
    const downsamplingStrategyOptions = getDownsamplingStrategyOptions();

    // Resolution of the processed volume embedded into the story export.
    const [targetResolution, setTargetResolution] = useState<ResolutionLevel>(
        effectiveExportProcessing.resolution,
    );
    const resolutionLevelOptions = getResolutionLevelOptions();

    // Output folder state, defaults to the user's Exports folder.
    const [outputPath, setOutputPath] = useState<string>(
        UiLocalStorageService.Export.getOutputDirectory() ?? `${userDataPath}/Exports`,
    );

    // Filename state, defaults to the story title.
    const [filename, setFilename] = useState<string | undefined>(
        regime.kind === "viewing"
            ? regime.history.current().stateTree.metadata.title ?? "export"
            : "export",
    );

    // Expanded states.
    const [isVolumeExpanded, setVolumeExpanded] = useState(
        UiLocalStorageService.Export.getVoumesExpandedState(),
    );
    const [isSegmentationExpanded, setSegmentationExpanded] = useState(
        UiLocalStorageService.Export.getSegmentationExpandedState(),
    );
    const [isSummaryExpanded, setSummaryExpanded] = useState(
        UiLocalStorageService.Export.getSummaryExpandedState(),
    );
    const [isHelpExpanded, setHelpExpanded] = useState(
        UiLocalStorageService.Export.getHelpExpandedState(),
    );

    // All hooks are called above, so it is safe to bail out here.
    if (regime.kind !== "viewing") {
        return null;
    }

    // The effective downsampling strategy:
    // Chosen directly with advanced export options. Otherwise, if enabled, derived from the simple level or strategy select.
    // If disabled in simple mode, fallback to "null".
    const effectiveDownsamplingStrategy = showAdvancedExportOptions
        ? downsamplingStrategy
        : enableDownsampling
        ? isStrategySimple
            ? DOWNSAMPLING_LEVEL_TO_STRATEGY[downsamplingLevel]
            : downsamplingStrategy
        : "null";

    // Names of the assets to be processed, used in the summary text.
    const volumeAssetsNames = volumeAssets.map((asset) => `"${asset.name}"`).join(", ");
    const segmentationAssetsNames = segmentationAssets
        .map((asset) => `"${asset.name}"`)
        .join(", ");

    // Formatted summary content based on current options.
    const summaryContent = (
        <>
            {volumeAssets.length > 0 && (
                <div>
                    <Text size="sm" fw={700}>
                        Volume
                    </Text>
                    <List size="sm" spacing={4}>
                        <List.Item>
                            <b>Source{volumeAssets.length > 1 ? "s" : ""}:</b>{" "}
                            {volumeAssetsNames}
                        </List.Item>
                        <List.Item>
                            <b>Downsampling strategy:</b>{" "}
                            {effectiveDownsamplingStrategy === "null"
                                ? "None"
                                : effectiveDownsamplingStrategy}
                        </List.Item>
                        <List.Item>
                            <b>Embedded resolution:</b> {targetResolution}
                        </List.Item>
                        <List.Item>
                            <b>Format:</b> <code>mrc</code>
                        </List.Item>
                    </List>
                </div>
            )}

            {segmentationAssets.length > 0 && (
                <div>
                    <Text size="sm" fw={700}>
                        Segmentation
                    </Text>
                    <List size="sm" spacing={4}>
                        <List.Item>
                            <b>Source{segmentationAssets.length > 1 ? "s" : ""}:</b>{" "}
                            {segmentationAssetsNames}
                        </List.Item>
                        <List.Item>
                            <b>Format:</b> <code>mrc</code>
                        </List.Item>
                    </List>
                </div>
            )}

            <div>
                <Text size="sm" fw={700}>
                    Output
                </Text>
                <List size="sm" spacing={4}>
                    <List.Item>
                        <b>Bundling:</b> MVSX archive, ready to be opened directly in the
                        viewer.
                    </List.Item>
                    <List.Item>
                        <b>Saved into:</b> <code>{`${outputPath}/${filename}.mvsx`}</code>
                    </List.Item>
                </List>
            </div>
        </>
    );

    // Formatted help content.
    const helpContent = (
        <>
            <Text size="sm">
                This dialogue sets properties for the current export. Initial settings can
                be changed in the Settings.
            </Text>

            {volumeAssets.length > 0 && (
                <div>
                    <Text size="sm" fw={700}>
                        Volume
                    </Text>
                    <List size="sm" spacing={4}>
                        {showAdvancedExportOptions ? (
                            <>
                                <List.Item>
                                    <b>Downsampling strategy:</b> the algorithm used to
                                    downsample the volume.
                                </List.Item>
                                <List.Item>
                                    <b>Volume resolution:</b> which processed resolution
                                    level is embedded into the story. If it is not
                                    available, the closest one is used.
                                </List.Item>
                            </>
                        ) : (
                            <List.Item>
                                <b>Downsampling quality:</b> the smaller the quality, the
                                smaller (and faster to load) the exported volume.
                            </List.Item>
                        )}
                    </List>
                </div>
            )}

            {segmentationAssets.length > 0 && (
                <div>
                    <Text size="sm" fw={700}>
                        Segmentation
                    </Text>
                    <List size="sm" spacing={4}>
                        <List.Item>
                            Segmentation sources are only serialized into the "mrc"
                            format, they are not downsampled.
                        </List.Item>
                    </List>
                </div>
            )}

            <div>
                <Text size="sm" fw={700}>
                    Output
                </Text>
                <List size="sm" spacing={4}>
                    <List.Item>
                        <b>Output folder:</b> where the final export is saved.
                    </List.Item>
                    <List.Item>
                        <b>Filename:</b> name of the exported <code>.mvsx</code> file,
                        defaults to the story title.
                    </List.Item>
                </List>
            </div>
        </>
    );

    // Warning shown when all local assets are processed and/or bundled, regardless of their usage in views.
    const allAssetsWarningText =
        processAllLocalAssets && bundleAllLocalAssets
            ? "All local assets, even those not used in any view (and possibly hidden ones), will be processed and bundled into the export. Processing can take a long time and the export can be quite big."
            : processAllLocalAssets
            ? "All local assets, even those not used in any view (and possibly hidden ones), will be processed. This can take a long time."
            : "All local assets, even those not used in any view (and possibly hidden ones), will be bundled into the export. The export can be quite big.";

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
                                    UiLocalStorageService.Export.setVoumesExpandedState(
                                        !isVolumeExpanded,
                                    );
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
                                            marginBottom: ".5em",
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

                                    {showAdvancedExportOptions ? (
                                        <>
                                            {/* All downsampling strategies, shown directly. */}
                                            <Select
                                                label="Downsampling strategy:"
                                                data={downsamplingStrategyOptions}
                                                value={downsamplingStrategy}
                                                allowDeselect={false}
                                                onChange={(value) =>
                                                    setDownsamplingStrategy(
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
                                        </>
                                    ) : (
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: ".5em",
                                            }}
                                        >
                                            <Checkbox
                                                label="Downsample volume"
                                                checked={enableDownsampling}
                                                onChange={(e) =>
                                                    setEnableDownsampling(
                                                        e.currentTarget.checked,
                                                    )
                                                }
                                                size="sm"
                                            />
                                            {isStrategySimple ? (
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
                                                    disabled={!enableDownsampling}
                                                    comboboxProps={{
                                                        withinPortal: true,
                                                        zIndex: 10000,
                                                    }}
                                                />
                                            ) : (
                                                <Select
                                                    label="Downsampling strategy:"
                                                    data={downsamplingStrategyOptions}
                                                    value={downsamplingStrategy}
                                                    allowDeselect={false}
                                                    onChange={(value) =>
                                                        setDownsamplingStrategy(
                                                            value as DownsamplingStrategy,
                                                        )
                                                    }
                                                    placeholder="Select a strategy..."
                                                    size="sm"
                                                    disabled={!enableDownsampling}
                                                    comboboxProps={{
                                                        withinPortal: true,
                                                        zIndex: 10000,
                                                    }}
                                                />
                                            )}
                                        </div>
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
                                    UiLocalStorageService.Export.setSegmentationExpandedState(
                                        !isSegmentationExpanded,
                                    );
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
                                        UiLocalStorageService.Export.setOutputDirectory(
                                            selected,
                                        );
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
                        gap: "1em",
                    }}
                >
                    {/* Collapsible summary. */}
                    <CollapsibleBlock
                        icon={<IconFileDescription size={18} />}
                        title="Summary"
                        titleTextSize="sm"
                        expanded={isSummaryExpanded}
                        onExpandedChange={(value) => {
                            UiLocalStorageService.Export.setSummaryExpandedState(
                                !isSummaryExpanded,
                            );
                            setSummaryExpanded(value);
                        }}
                    >
                        {summaryContent}
                    </CollapsibleBlock>

                    {/* Collapsible help. */}
                    <CollapsibleBlock
                        icon={<IconHelpCircle size={18} />}
                        title="Help"
                        titleTextSize="sm"
                        expanded={isHelpExpanded}
                        onExpandedChange={(value) => {
                            UiLocalStorageService.Export.setHelpExpandedState(
                                !isHelpExpanded,
                            );
                            setHelpExpanded(value);
                        }}
                    >
                        {helpContent}
                    </CollapsibleBlock>
                </div>
            </div>

            {/* Warning shown when all local assets are processed and/or bundled. */}
            {(processAllLocalAssets || bundleAllLocalAssets) && (
                <div style={{ display: "flex", justifyContent: "center" }}>
                    <WarningMessage
                        text={allAssetsWarningText}
                        style={{
                            maxWidth: "80%",
                            marginTop: "1.5em",
                        }}
                    ></WarningMessage>
                </div>
            )}

            <FileOverrideWarningMessage
                outputPath={outputPath}
                filename={filename ?? "export"}
            />

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
                            } as ProcessVolumeRequestWithoutFilepathsAndBundlingApproach, // TODO: code smell, we do not want to use directly api request, create facade object
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
