import { useUserSettings } from "../../providers/UserSettingsProvider";

export function useDomain() {
    const userSettings = useUserSettings();
    return `http://localhost:${userSettings.settings.serverPort}`;
}
