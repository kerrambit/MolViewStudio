/**
 * File with global types definitions.
 */

type EventPayloadMapping = {
    data: string;
    requestUserSettings: UserSettings;
    requestApplicationExit: void;
    requestToOpenDevTools: void;
    openFileExplorer: FileData | null;
    requestEnvironment: Environment;
    changeUserSettings: UserSettings;
};

type UnsubscribeFunction = () => void;

interface Window {
    electron: {
        subscribeData: (
            callback: (data: string) => void
        ) => UnsubscribeFunction;

        requestUserSettings: () => Promise<UserSettings>;

        requestApplicationExit: () => Promise<void>;

        requestToOpenDevTools: () => Promise<void>;

        requestEnvironment: () => Promise<Environment>;

        openFileExplorer: () => Promise<FileData | null>;

        changeUserSettings: (settings: UserSettings) => void;
    };
}

type Environment = {
    isDev: boolean;
};

interface FileData {
    path: string;
    extension: string;
    name: string;
    binary: boolean;
    content: string | Uint8Array<ArrayBuffer>;
}

type Language = "en" | "de";

type UserSettings = {
    lang: Language;
    serverPort: number;
};
