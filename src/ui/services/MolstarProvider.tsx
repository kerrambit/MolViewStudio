import React, {
    createContext,
    useState,
    type ReactNode,
    useContext,
} from "react";
import "../i18n";
import { PluginState } from "molstar/lib/mol-plugin/state";

type MolstarContextType = {
    snapshot: PluginState.Snapshot | null;
    setSnapshot: React.Dispatch<
        React.SetStateAction<PluginState.Snapshot | null>
    >;
};

export function useMolstar() {
    const context = useContext(MolstarContext);
    if (!context) {
        throw new Error("Molstar must be used within MolstarProvider");
    }
    return context;
}

export const MolstarContext = createContext<MolstarContextType | null>(null);

export function MolstarProvider({ children }: { children: ReactNode }) {
    const [snapshot, setSnapshot] = useState<PluginState.Snapshot | null>(null);

    return (
        <MolstarContext.Provider value={{ snapshot, setSnapshot }}>
            {children}
        </MolstarContext.Provider>
    );
}
