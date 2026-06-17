import { BaseSettings } from "../../features/settings/components/BaseSettings";
import { UiSettingsForm } from "../../features/settings/components/UiSettingsForm";

export default function UiSettingsPage() {
    return (
        <BaseSettings>
            <UiSettingsForm />
        </BaseSettings>
    );
}
