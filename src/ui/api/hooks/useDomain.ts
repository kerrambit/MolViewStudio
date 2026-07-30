import { useUserSettings } from "../../hooks/useUserSettings";

export function useDomain() {
    const userSettings = useUserSettings();
    return {
        http: `http://localhost:${userSettings.settings.serverPort}`,
        ws: `ws://localhost:${userSettings.settings.serverPort}`,
    };
}
