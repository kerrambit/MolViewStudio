/**
 * File with global types definitions.
 */

type EventPayloadMapping = {
    data: string;
    requestUserSettings: UserSettings;
    requestApplicationExit: void;
    requestToOpenDevTools: void;
    // TODO: temporary return FileData[] instead of FileData
    openFileExplorer: FileData[] | null;
    saveData: boolean;
    saveTemporaryData: boolean;
    getFileData: FileData[] | null;
    requestEnvironment: Environment;
    changeUserSettings: UserSettings;
};

type UnsubscribeFunction = () => void;

interface Window {
    electron: {
        subscribeData: (
            callback: (data: string) => void,
        ) => UnsubscribeFunction;

        requestUserSettings: () => Promise<UserSettings>;

        requestApplicationExit: () => Promise<void>;

        requestToOpenDevTools: () => Promise<void>;

        requestEnvironment: () => Promise<Environment>;

        // TODO: temporary return FileData[] instead of FileData
        openFileExplorer: () => Promise<FileData[] | null>;

        getFileData: (paths: string[]) => Promise<FileData[] | null>;

        saveData: (data: ArrayBuffer, path: string) => Promise<boolean>;

        saveTemporaryData: (
            data: ArrayBuffer,
            path: string,
        ) => Promise<boolean>;

        changeUserSettings: (settings: UserSettings) => void;
    };
}

type Environment = {
    isDev: boolean;
};

interface FileData {
    path: string;
    extension: string;
    name: string; // TODO: is the name without path, is the name with extension?
    binary: boolean;
    content: string | Uint8Array<ArrayBuffer>;
}

interface SaveDataPackage {
    data: ArrayBuffer;
    path: string;
}

type Language = "en" | "de";

type UserSettings = {
    lang: Language;
    serverPort: number;
};
