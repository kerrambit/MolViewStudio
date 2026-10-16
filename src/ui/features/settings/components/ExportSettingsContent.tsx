/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { Stack, Paper, Checkbox, Text, Divider } from "@mantine/core";
import { useExportSettings } from "../hooks/useExportSettings";

export function ExportSettingsContent() {
    const {
        currentExportSettings: { bundleAllLocalAssets, processAllLocalAssets },
        setBundleAllLocalAssets,
        setProcessAllLocalAssets,
        setExportSettings,
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
                    label="Bundle all local assets even if unused in views"
                    description="Forces the export to include every local asset in the workspace directory, bypassing the active dependency check."
                    checked={bundleAllLocalAssets}
                    onChange={(event) =>
                        setBundleAllLocalAssets(event.currentTarget.checked)
                    }
                />

                <Checkbox
                    label="Process all local (Volume/Segementation) assets even if unused in views"
                    description="Gives users the possibility to process every (Volume/Segementation) local asset in the workspace directory, bypassing the active dependency check. Checks 'Bundle all local assets even if unused in views'."
                    checked={processAllLocalAssets}
                    onChange={(event) => {
                        if (event.currentTarget.checked) {
                            setExportSettings(true, true);
                        } else {
                            setProcessAllLocalAssets(false);
                        }
                    }}
                />
            </Stack>
        </Paper>
    );
}
