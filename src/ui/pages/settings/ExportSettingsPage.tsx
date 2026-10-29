/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { BaseSettings } from "../../features/settings/components/BaseSettings";
import { ExportSettingsContent } from "../../features/settings/components/ExportSettingsContent";

export default function ExportSettingsPage() {
    return (
        <BaseSettings autoSavedPage={true}>
            <ExportSettingsContent />
        </BaseSettings>
    );
}
