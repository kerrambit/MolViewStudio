import { create } from "zustand";
import { type MVSData_States } from "molstar/lib/extensions/mvs/mvs-data";
import type { SerializedAssets } from "../lib/molstar";
import type { PluginState } from "molstar/lib/mol-plugin/state";
import type { PluginStateSnapshotManager } from "molstar/lib/mol-plugin-state/manager/snapshots";

export class SourceTreeHistory {
    private readonly past: Readonly<MVSData_States[]>;
    private readonly present: MVSData_States;
    private readonly future: Readonly<MVSData_States[]>;

    private constructor(
        past: Readonly<MVSData_States[]>,
        present: MVSData_States,
        future: Readonly<MVSData_States[]>,
    ) {
        this.past = past;
        this.present = present;
        this.future = future;
    }

    public static init(initial: MVSData_States): SourceTreeHistory {
        return new SourceTreeHistory([], initial, []);
    }

    public current(): MVSData_States {
        return this.present;
    }

    public canUndo(): boolean {
        return this.past.length > 0;
    }

    public canRedo(): boolean {
        return this.future.length > 0;
    }

    add(next: MVSData_States): SourceTreeHistory {
        return new SourceTreeHistory([...this.past, this.present], next, []);
    }

    undo(): SourceTreeHistory {
        if (!this.canUndo()) return this;

        const prev = this.past[this.past.length - 1];
        return new SourceTreeHistory(this.past.slice(0, -1), prev, [
            this.present,
            ...this.future,
        ]);
    }

    redo(): SourceTreeHistory {
        if (!this.canRedo()) return this;

        const next = this.future[0];
        return new SourceTreeHistory(
            [...this.past, this.present],
            next,
            this.future.slice(1),
        );
    }
}

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
    commitStateTree: (newStateTree: MVSData_States) => void;
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
                    SourceTreeHistory.init(initialStateTree),
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
        commitStateTree: (newStateTree) =>
            set(
                makeViewing(
                    set,
                    viewedFile,
                    sourceUrl,
                    history.add(newStateTree),
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
