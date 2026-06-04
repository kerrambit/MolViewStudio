import { createContext, useState, type ReactNode, useContext } from "react";
import { type MVSData_States } from "molstar/lib/extensions/mvs/mvs-data";
import type { SerializedAssets } from "../../molstar-wrapper/src";
import type { PluginState } from "molstar/lib/mol-plugin/state";
import type { PluginStateSnapshotManager } from "molstar/lib/mol-plugin-state/manager/snapshots";

export type IdlingRegime = {
    kind: "idling";
};

export type StagingRegime = {
    kind: "staging";
    fileToView: FileData;
};

export type ViewingRegime = {
    kind: "viewing";
    fileToView: FileData;
    stateTree: MVSData_States;
    sourceUrl: string;
};

export type RestoringRegime = {
    kind: "restoring";
    fileToView: FileData;
    stateTree: MVSData_States;
    sourceUrl: string;
    snapshot: PluginState.Snapshot;
    snapshotManagerState: PluginStateSnapshotManager.StateSnapshot;
    arcpAssets: SerializedAssets; // TODO: this will be probably in my ManagedAssetsProvider
};

export type Regime =
    | IdlingRegime
    | StagingRegime
    | ViewingRegime
    | RestoringRegime;

export type RegimeContextType = {
    regime: Regime;
    setRegime: (regime: Regime) => void;
};

const initialRegime: IdlingRegime = { kind: "idling" };

export const RegimeContext = createContext<RegimeContextType | undefined>(
    undefined,
);

export function useRegime() {
    const context = useContext(RegimeContext);
    if (!context) {
        throw new Error("Regime must be used within RegimeProvider");
    }
    return context;
}

export function RegimeProvider({ children }: { children: ReactNode }) {
    const [regime, setRegime] = useState<Regime>(initialRegime);

    return (
        <RegimeContext.Provider value={{ regime, setRegime }}>
            {children}
        </RegimeContext.Provider>
    );
}
