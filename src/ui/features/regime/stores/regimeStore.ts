/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { create } from "zustand";
import { History } from "../../../lib/history/History";
import { getCurrentViewIndex } from "../../../lib/molstar";
import { loggerUi } from "../../logger/services/UiLoggingService";
import { useManagedAssetsStore } from "../../managed-assets/stores/managedAssetsStore";
import type {
    Regime,
    IdlingRegime,
    StagingRegime,
    SourceTreeHistory,
    ViewingRegime,
    RestoringSession,
    RestoringRegime,
} from "../domain/Regime";

function makeIdling(set: (regime: Regime) => void): IdlingRegime {
    return {
        kind: "idling",
        stageFile: (stagedFile, stagedAsFile) =>
            set(makeStaging(set, stagedFile, stagedAsFile)),
        reset: () => {
            set(makeIdling(set));
            loggerUi.info("Idling regime was reset.");
        },
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
                        viewIndex: undefined,
                        assetsUseCounts: useManagedAssetsStore
                            .getState()
                            .getAssetUseCounts(),
                        description: "Initial load.",
                        timestamp: Date.now(),
                    }),
                ),
            ),
        reset: () => {
            set(makeIdling(set));
            loggerUi.info("Staging regime was reset.");
        },
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
        reset: () => {
            set(makeIdling(set));
            loggerUi.info("Viewing regime was reset.");
        },
        commitStateTree: (newStateTree, description, viewIndex) =>
            set(
                makeViewing(
                    set,
                    viewedFile,
                    sourceUrl,
                    history.add({
                        stateTree: newStateTree,
                        viewIndex: viewIndex ? viewIndex : getCurrentViewIndex(),
                        assetsUseCounts: useManagedAssetsStore
                            .getState()
                            .getAssetUseCounts(),
                        description: description,
                        timestamp: Date.now(),
                    }),
                ),
            ),
        undo: () => set(makeViewing(set, viewedFile, sourceUrl, history.undo())),
        redo: () => set(makeViewing(set, viewedFile, sourceUrl, history.redo())),
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
        reset: () => {
            set(makeIdling(set));
            loggerUi.info("Resoring regime was reset.");
        },
        undo: () =>
            set(makeRestoring(set, viewedFile, sourceUrl, history.undo(), session)),
        redo: () =>
            set(makeRestoring(set, viewedFile, sourceUrl, history.redo(), session)),
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
