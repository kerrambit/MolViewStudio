import { useUserSettings } from "../../hooks/useUserSettings";

export function useDomain() {
    const userSettings = useUserSettings();
    return `http://localhost:${userSettings.settings.serverPort}`;
}
