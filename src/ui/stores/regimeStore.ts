import { create } from "zustand";
import { type MVSData_States } from "molstar/lib/extensions/mvs/mvs-data";
import type { SerializedAssets } from "../lib/molstar";
import { History } from "../lib/history/History";
import type { PluginState } from "molstar/lib/mol-plugin/state";
import type { PluginStateSnapshotManager } from "molstar/lib/mol-plugin-state/manager/snapshots";

export type SourceTreeHistoryNode = {
    stateTree: MVSData_States;
    description: string;
    timestamp: number;
};

export type SourceTreeHistory = History<SourceTreeHistoryNode>;

export type RestoringSession = {
    snapshot: PluginState.Snapshot;
    snapshotManagerState: PluginStateSnapshotManager.StateSnapshot;
    arcpAssets: SerializedAssets; // TODO: this will be probably in my ManagedAssetsProvider
};

export type IdlingRegime = {
    kind: "idling";
    stageFile: (stagedFile: FileData, stagedAsFile: boolean) => void;
    reset: () => void;
};

export type StagingRegime = {
    kind: "staging";
    stagedFile: FileData;
    stagedAsFile: boolean;
    viewFile: (
        viewedFile: FileData,
        sourceUrl: string,
        initialStateTree: MVSData_States,
    ) => void;
    reset: () => void;
};

export type ViewingRegime = {
    kind: "viewing";
    stageFile: (stagedFile: FileData, stagedAsFile: boolean) => void;
    viewedFile: FileData;
    sourceUrl: string;
    history: SourceTreeHistory;
    suspend: (session: RestoringSession) => void;
    reset: () => void;
    commitStateTree: (
        newStateTree: MVSData_States,
        description: string,
    ) => void;
    undo: () => void;
    redo: () => void;
};

export type RestoringRegime = {
    kind: "restoring";
    viewedFile: FileData;
    sourceUrl: string;
    history: SourceTreeHistory;
    session: RestoringSession;
    resume: () => void;
    reset: () => void;
    undo: () => void;
    redo: () => void;
};

export type Regime =
    | IdlingRegime
    | StagingRegime
    | ViewingRegime
    | RestoringRegime;

function makeIdling(set: (regime: Regime) => void): IdlingRegime {
    return {
        kind: "idling",
        stageFile: (stagedFile, stagedAsFile) =>
            set(makeStaging(set, stagedFile, stagedAsFile)),
        reset: () => set(makeIdling(set)),
    };
}

function makeStaging(
    set: (regime: Regime) => void,
    stagedFile: FileData,
    stagedAsFile: boolean,
): StagingRegime {
    return {
        kind: "staging",
        stagedAsFile: stagedAsFile,
        stagedFile,
        viewFile: (viewedFile, sourceUrl, initialStateTree) =>
            set(
                makeViewing(
                    set,
                    viewedFile,
                    sourceUrl,
                    History.initialize({
                        stateTree: initialStateTree,
                        description: "Initial load.",
                        timestamp: Date.now(),
                    }),
                ),
            ),
        reset: () => set(makeIdling(set)),
    };
}

function makeViewing(
    set: (regime: Regime) => void,
    viewedFile: FileData,
    sourceUrl: string,
    history: SourceTreeHistory,
): ViewingRegime {
    return {
        kind: "viewing",
        stageFile: (stagedFile, stagedAsFile) =>
            set(makeStaging(set, stagedFile, stagedAsFile)),
        viewedFile,
        sourceUrl,
        history,
        suspend: (session) =>
            set(makeRestoring(set, viewedFile, sourceUrl, history, session)),
        reset: () => set(makeIdling(set)),
        commitStateTree: (newStateTree, description) =>
            set(
                makeViewing(
                    set,
                    viewedFile,
                    sourceUrl,
                    history.add({
                        stateTree: newStateTree,
                        description: description,
                        timestamp: Date.now(),
                    }),
                ),
            ),
        undo: () =>
            set(makeViewing(set, viewedFile, sourceUrl, history.undo())),
        redo: () =>
            set(makeViewing(set, viewedFile, sourceUrl, history.redo())),
    };
}

function makeRestoring(
    set: (regime: Regime) => void,
    viewedFile: FileData,
    sourceUrl: string,
    history: SourceTreeHistory,
    session: RestoringSession,
): RestoringRegime {
    return {
        kind: "restoring",
        viewedFile,
        sourceUrl,
        history,
        session,
        resume: () => set(makeViewing(set, viewedFile, sourceUrl, history)),
        reset: () => set(makeIdling(set)),
        undo: () =>
            set(
                makeRestoring(
                    set,
                    viewedFile,
                    sourceUrl,
                    history.undo(),
                    session,
                ),
            ),
        redo: () =>
            set(
                makeRestoring(
                    set,
                    viewedFile,
                    sourceUrl,
                    history.redo(),
                    session,
                ),
            ),
    };
}

export type RegimeStore = {
    regime: Regime;
};

export const useRegimeStore = create<RegimeStore>((set) => {
    const setRegime: (regime: Regime) => void = (regime) => set({ regime });
    return {
        regime: makeIdling(setRegime),
    };
});
