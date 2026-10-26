/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { BaseSettings } from "../../features/settings/components/BaseSettings";
import { ProcessingGeneralSettingsContent } from "../../features/settings/components/ProcessingGeneralSettingsContent";

export default function ProcessingGeneralSettingsPage() {
    return (
        <BaseSettings autoSavedPage={true}>
            <ProcessingGeneralSettingsContent />
        </BaseSettings>
    );
}
