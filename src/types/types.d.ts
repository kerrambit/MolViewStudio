/**
 * File with global types definitions.
 */

type EventPayloadMapping = {
    data: string;
    requestUserSettings: UserSettings;
    requestBuildInformation: BuildInformation;
    requestApplicationExit: void;
    requestToOpenDevTools: void;
    requestToOpenExternal: string;
    openFileExplorer: FileData[] | Error;
    saveData: void | Error;
    saveTemporaryData: void | Error;
    getFileData: FileData[] | Error;
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

        requestBuildInformation: () => BuildInformation;

        requestApplicationExit: () => Promise<void>;

        requestToOpenDevTools: () => Promise<void>;

        requestToOpenExternal: (url: string) => void;

        requestEnvironment: () => Environment;

        openFileExplorer: (
            multiSelections: boolean,
            filters: FileFilter[],
        ) => Promise<FileData[] | Error>;

        getFileData: (paths: string[]) => Promise<FileData[] | Error>;

        saveData: (data: ArrayBuffer, path: string) => Promise<void | Error>;

        saveTemporaryData: (
            data: ArrayBuffer,
            path: string,
        ) => Promise<void | Error>;

        changeUserSettings: (settings: UserSettings) => void;
    };
}

type FileFilter = {
    name: string;
    extensions: string[];
};

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
    colorScheme: "light" | "dark";
    colorTheme:
        | "ocean"
        | "forest"
        | "sunset"
        | "royal"
        | "crimson"
        | "golden"
        | "teal"
        | "lavender"
        | "charcoal"
        | "sky"
        | "emerald"
        | "amber";
};

type TranslateFunction = TFunction<"translation", undefined>;

interface BuildInformation {
    app: string;
    appVersion: string;
    commit: string;
    buildDate: string;
    electron: string;
    chrome: string;
    node: string;
    platform: string;
    arch: string;
    osRelease: string;
    molstarVersion: string;
    volsegtoolsVersion: string;
}
