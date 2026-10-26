/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { Stack, Paper, Checkbox, Text, Divider } from "@mantine/core";
import { useExportSettings } from "../hooks/useExportSettings";

export function ExportSettingsContent() {
    const {
        currentExportSettings: {
            bundleAllLocalAssets,
            processAllLocalAssets,
            showAdvancedExportOptions,
        },
        setBundleAllLocalAssets,
        setProcessAllLocalAssets,
        setBundleAndProcessAllLocalAssetsExportSettings,
        setShowAdvancedExportOptions,
    } = useExportSettings();

    // Render the component.
    return (
        <Paper withBorder p="md">
            <Text fw={600} size="md" mb="xs">
                Options
            </Text>

            <Divider mb="md" />

            <Stack gap="md">
                <Checkbox
                    label="Show all advanced options in Export dialogue"
                    checked={showAdvancedExportOptions}
                    onChange={(event) =>
                        setShowAdvancedExportOptions(event.currentTarget.checked)
                    }
                />

                <Checkbox
                    label="Bundle all local assets even if unused in views"
                    description="Forces the export to include every (Volume/Segementation) local asset in the workspace."
                    checked={bundleAllLocalAssets}
                    onChange={(event) =>
                        setBundleAllLocalAssets(event.currentTarget.checked)
                    }
                />

                <Checkbox
                    label="Process all local assets even if unused in views"
                    description="Forces the export to process every (Volume/Segementation) local asset in the workspace."
                    checked={processAllLocalAssets}
                    onChange={(event) => {
                        if (event.currentTarget.checked) {
                            setBundleAndProcessAllLocalAssetsExportSettings(true, true);
                        } else {
                            setProcessAllLocalAssets(false);
                        }
                    }}
                />
            </Stack>
        </Paper>
    );
}
