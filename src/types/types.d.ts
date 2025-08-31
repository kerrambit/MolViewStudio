/**
 * File with global types definitions.
 */

type EventPayloadMapping = {
    data: string;
    requestUserSettings: UserSettings;
    changeUserSettings: UserSettings;
};

type UnsubscribeFunction = () => void;

interface Window {
    electron: {
        subscribeData: (
            callback: (data: string) => void
        ) => UnsubscribeFunction;

        requestUserSettings: () => Promise<UserSettings>;

        changeUserSettings: (settings: UserSettings) => void;
    };
}

type Language = "en" | "de";

type UserSettings = {
    lang: Language;
    serverPort: number;
};
