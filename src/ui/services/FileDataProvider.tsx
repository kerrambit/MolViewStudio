import { createContext, useState, type ReactNode, useContext } from "react";
import { MVSData } from "molstar/lib/extensions/mvs/mvs-data";
import type { SerializedAssets } from "../../molstar-wrapper/src";
import type { PluginState } from "molstar/lib/mol-plugin/state";
import type { PluginStateSnapshotManager } from "molstar/lib/mol-plugin-state/manager/snapshots";

export type ProcessingRegime = {
    kind: "processing";
    fileToProcess: FileData;
};

export type StagingRegime = {
    kind: "staging";
    fileToView: FileData;
};

export type DeconstructedFileToView = {
    assets: FileData[];
};

export type ViewingRegime = {
    kind: "viewing";
    fileToView: FileData;
    deconstructedFile: DeconstructedFileToView;
    stateTree: MVSData;
    sourceUrl: string;
};

export type RestoringRegime = {
    kind: "restoring";
    fileToView: FileData;
    deconstructedFile: DeconstructedFileToView;
    stateTree: MVSData;
    sourceUrl: string;
    snapshot: PluginState.Snapshot;
    snapshotManagerState: PluginStateSnapshotManager.StateSnapshot;
    arcpAssets: SerializedAssets;
};

export type IdlingRegime = {
    kind: "idling";
};

export type Regime =
    | ProcessingRegime
    | StagingRegime
    | ViewingRegime
    | RestoringRegime
    | IdlingRegime;

export type FileDataContextType = {
    regime: Regime;
    setRegime: (regime: Regime) => void;
};

const initialRegime: IdlingRegime = { kind: "idling" };

export const FileDataContext = createContext<FileDataContextType | undefined>(
    undefined,
);

export function useFileData() {
    const context = useContext(FileDataContext);
    if (!context) {
        throw new Error("File data must be used within FileDataProvider");
    }
    return context;
}

export function FileDataProvider({ children }: { children: ReactNode }) {
    const [regime, setRegime] = useState<Regime>(initialRegime);

    return (
        <FileDataContext.Provider value={{ regime, setRegime }}>
            {children}
        </FileDataContext.Provider>
    );
}
