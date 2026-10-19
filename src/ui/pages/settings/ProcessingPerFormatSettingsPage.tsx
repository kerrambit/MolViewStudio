/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { BaseSettings } from "../../features/settings/components/BaseSettings";
import { ProcessingPerFormatSettingsContent } from "../../features/settings/components/ProcessingPerFormatSettingsContent";

export default function ProcessingPerFormatSettingsPage() {
    return (
        <BaseSettings autoSavedPage={true}>
            <ProcessingPerFormatSettingsContent />
        </BaseSettings>
    );
}
