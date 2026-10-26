/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { Divider, Paper, Select, Stack, Text } from "@mantine/core";
import { getAssetConfig } from "../../assets/domain/assetsDefinitions";
import { getDownsamplingStrategyOptions } from "../../processing/downsampling/config/DownsamplingStrategy";
import { getResolutionLevelOptions } from "../../processing/resolution/domain/ResolutionLevel";
import { useProcessingSettings } from "../hooks/useProcessingSettings";

interface PerFormatProcessingSettingsPaperProps {
    /**
     * Extension without dot, e.g. `"map"`.
     */
    extension: string;
}

export function PerFormatProcessingSettingsPaper({
    extension,
}: PerFormatProcessingSettingsPaperProps) {
    // Use processing settings.
    const {
        getPerFormatProcessingSettings,
        setPerFormatRequireProcessingDownsamplingMethod,
        setPerFormatPreviewProcessingSettings,
        setPerFormatExportProcessingSettings,
    } = useProcessingSettings();

    const entry = getPerFormatProcessingSettings(extension);
    const definition = getAssetConfig(extension);
    if (!definition) {
        return null;
    }

    const requiresProcessing = definition.requiresProcessing;
    const downsamplingMethodOptions = getDownsamplingStrategyOptions();
    const resolutionOptions = getResolutionLevelOptions();

    // Render the component.
    return (
        <Paper withBorder p="md">
            <Text fw={600} size="xl" mb="xs">
                .{extension}
            </Text>

            <Text size="sm" c="dimmed" mb="xs">
                {definition?.description ?? "Unknown format"}
            </Text>

            <Divider mb="md" />

            <Stack gap="md" style={{ maxWidth: 480 }}>
                {requiresProcessing && (
                    <>
                        <Text fw={500} size="xl">
                            Required processing
                        </Text>
                        <Select
                            label="Downsampling method"
                            description="Applied when the file cannot be opened directly and must be processed."
                            data={downsamplingMethodOptions}
                            value={entry.requireProcessing.downsamplingStrategy}
                            allowDeselect={false}
                            onChange={(value) =>
                                value &&
                                setPerFormatRequireProcessingDownsamplingMethod(
                                    extension,
                                    value,
                                )
                            }
                        />
                        <Divider mt="sm" />
                    </>
                )}

                <Text fw={500} size="xl">
                    Preview processing
                </Text>

                <Select
                    label="Downsampling method"
                    data={downsamplingMethodOptions}
                    value={entry.previewProcessing.downsamplingStrategy}
                    allowDeselect={false}
                    onChange={(value) =>
                        value &&
                        setPerFormatPreviewProcessingSettings(
                            extension,
                            value,
                            entry.previewProcessing.resolution,
                        )
                    }
                />

                <Select
                    label="Resolution"
                    description="Resolution of the created preview."
                    data={resolutionOptions}
                    value={entry.previewProcessing.resolution}
                    allowDeselect={false}
                    onChange={(value) =>
                        value &&
                        setPerFormatPreviewProcessingSettings(
                            extension,
                            entry.previewProcessing.downsamplingStrategy,
                            value,
                        )
                    }
                />

                <Divider mt="sm" />

                <Text fw={500} size="xl">
                    Export & On-Load processing
                </Text>

                <Select
                    label="Downsampling method"
                    description="Used when the export processes only files of this format. Or when working with Process-On-Load workflow (see Settings - Processing)."
                    data={downsamplingMethodOptions}
                    value={entry.exportProcessing.downsamplingStrategy}
                    allowDeselect={false}
                    onChange={(value) =>
                        value &&
                        setPerFormatExportProcessingSettings(
                            extension,
                            value,
                            entry.exportProcessing.resolution,
                        )
                    }
                />

                <Select
                    label="Resolution"
                    description="Resolution of the processed volume embedded into the export."
                    data={resolutionOptions}
                    value={entry.exportProcessing.resolution}
                    allowDeselect={false}
                    onChange={(value) =>
                        value &&
                        setPerFormatExportProcessingSettings(
                            extension,
                            entry.exportProcessing.downsamplingStrategy,
                            value,
                        )
                    }
                />
            </Stack>
        </Paper>
    );
}
