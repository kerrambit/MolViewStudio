/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useUserSettingsStore } from "../../../stores/userSettingsStore";

export function useExportSettings() {
    // Use user settings.
    const settings = useUserSettingsStore((state) => state.settings);
    const setSettings = useUserSettingsStore((state) => state.setSettings);

    const setBundleAndProcessAllLocalAssetsExportSettings = (
        bundleAllLocalAssets: boolean,
        processAllLocalAssets: boolean,
    ) => {
        setSettings({
            ...settings,
            export: { ...settings.export, bundleAllLocalAssets, processAllLocalAssets },
        });
    };

    const setBundleAllLocalAssets = (bundleAllLocalAssets: boolean) => {
        setSettings({
            ...settings,
            export: { ...settings.export, bundleAllLocalAssets },
        });
    };

    const setProcessAllLocalAssets = (processAllLocalAssets: boolean) => {
        setSettings({
            ...settings,
            export: { ...settings.export, processAllLocalAssets },
        });
    };

    const setShowAdvancedExportOptions = (showAdvancedExportOptions: boolean) => {
        setSettings({
            ...settings,
            export: { ...settings.export, showAdvancedExportOptions },
        });
    };

    return {
        currentExportSettings: settings.export,
        setBundleAllLocalAssets,
        setProcessAllLocalAssets,
        setBundleAndProcessAllLocalAssetsExportSettings,
        setShowAdvancedExportOptions,
    };
}
