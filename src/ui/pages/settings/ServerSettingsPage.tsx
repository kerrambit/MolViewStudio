import { BaseSettings } from "../../features/settings/components/BaseSettings";
import { ServerSettingsContent } from "../../features/settings/components/ServerSettingsContent";

export default function ServerSettingsPage() {
    return (
        <BaseSettings autoSavedPage={false}>
            <ServerSettingsContent />
        </BaseSettings>
    );
}
