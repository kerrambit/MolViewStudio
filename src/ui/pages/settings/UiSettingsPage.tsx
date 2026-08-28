/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { BaseSettings } from "../../features/settings/components/BaseSettings";
import { UiSettingsForm } from "../../features/settings/components/UiSettingsForm";

export default function UiSettingsPage() {
    return (
        <BaseSettings>
            <UiSettingsForm />
        </BaseSettings>
    );
}
