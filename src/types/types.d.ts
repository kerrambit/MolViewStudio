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
    requestToOpenUserDataFolder: void | Error;
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

        requestToOpenUserDataFolder: () => Promise<void | Error>;

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
    preferredServerPort: number;
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

/**
 * Type Url based on Molstar's Asset.Url type.
 */
type Url = {
    kind: "url";
    id: UUID;
    url: string;
    title?: string;
    body?: string;
    headers?: Record<string, string>;
};

/**
 * Object mirroring Assets as managed by Molstar Asset Manager.
 */
interface ManagedAsset {
    /**
     * Id of the managed assset, which does not change through the app lifetime.
     */
    id: string;

    /**
     * All managed assets are of type `Url`, that is because remotes are URL always,
     * and local files are converted into assets in the form of `arcp` protocol and thus available via URL, too.
     */
    asset: Url;

    /**
     * Relative path inside MVSX archive. E.g. "volume.bcif" or "volumes/volume.bcif".
     * For `remote` ManagedAsset it is same as `asset.url`.
     */
    relativePath: string;

    /**
     * Mirrors Molstar Asset Manager function `set()` and its parameter `isStatic` (true value is "local").
     */
    tag: "local" | "remote";

    /**
     * Only the name of the file with its extension.
     * For `remote` ManagedAsset it is same as `asset.url`.
     */
    name: string;

    /**
     * Number of times this asset is referenced across all views.
     */
    useCount: number;
}
