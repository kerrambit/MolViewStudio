import { createContext, useState, type ReactNode, useContext } from "react";
import { MVSData } from "molstar/lib/extensions/mvs/mvs-data";

export type ProcessingRegime = {
    kind: "processing";
    fileToProcess: FileData;
};

export type DeconstructedFileToView = {
    assets: FileData[];
};

export type ViewingRegime = {
    kind: "viewing";
    fileToView: FileData | null;
    deconstructedFile: DeconstructedFileToView | null;
    stateTree: MVSData;
};

export type IdlingRegime = {
    kind: "idling";
};

export type Regime = ProcessingRegime | ViewingRegime | IdlingRegime;

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
