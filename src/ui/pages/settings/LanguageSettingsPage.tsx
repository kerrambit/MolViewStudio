import { BaseSettings } from "../../features/settings/components/BaseSettings";
import { LanguageSettingsForm } from "../../features/settings/components/LanguageSettingsForm";

export default function LanguageSettingsPage() {
    return (
        <BaseSettings>
            <LanguageSettingsForm />
        </BaseSettings>
    );
}
