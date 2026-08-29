/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { BaseSettings } from "../../features/settings/components/BaseSettings";
import { ServerSettingsContent } from "../../features/settings/components/ServerSettingsContent";

export default function ServerSettingsPage() {
    return (
        <BaseSettings autoSavedPage={false}>
            <ServerSettingsContent />
        </BaseSettings>
    );
}
