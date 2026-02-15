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

        requestEnvironment: () => Environment;

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
    userDataPath: string;
};

interface FileData {
    /**
     * The whole complete file path, e.g. "/home/user/data/tmp/emd_53130_r2_tf0.cif".
     */
    path: string;
    /**
     * Extension without dot, e.g. "cif".
     */
    extension: string;
    /**
     * Name of the file with extension "emd_53130_r2_tf0.cif".
     */
    // TODO: remove extension from here
    name: string;
    /**
     * Flag if the file is binary or not.
     */
    binary: boolean;
    /**
     * Content of the file.
     */
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
