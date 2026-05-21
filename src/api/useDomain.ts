import { useUserSettings } from "../ui/services/UserSettingsProvider";

export function useDomain() {
    const userSettings = useUserSettings();
    return `http://localhost:${userSettings.settings.serverPort}`;
}
