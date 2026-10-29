/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { type MVSData_States } from "molstar/lib/extensions/mvs/mvs-data";
import { History } from "../../../lib/history/History";
import type { PluginState } from "molstar/lib/mol-plugin/state";
import type { PluginStateSnapshotManager } from "molstar/lib/mol-plugin-state/manager/snapshots";
import { type SerializedAssets } from "../../../lib/molstar";

export type SourceTreeHistoryNode = {
    stateTree: MVSData_States;
    viewIndex: number | undefined;
    assetsUseCounts: Map<string, number>;
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
        viewIndex?: number | undefined,
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

export type Regime = IdlingRegime | StagingRegime | ViewingRegime | RestoringRegime;
