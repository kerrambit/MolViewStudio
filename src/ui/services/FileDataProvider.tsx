import { createContext, useState, type ReactNode, useContext } from "react";

export type FileRegime = "toProcess" | "toView";

export type FileDataContextType = {
    fileData: FileData | undefined;
    setFileData: (fileData: FileData) => void;
    regime: FileRegime;
    setRegime: (regime: FileRegime) => void;
};

export function useFileData() {
    const context = useContext(FileDataContext);
    if (!context) {
        throw new Error("File data must be used within FileDataProvider");
    }
    return context;
}

export const FileDataContext = createContext<FileDataContextType | null>(null);

export function FileDataProvider({ children }: { children: ReactNode }) {
    const [fileData, setFileData] = useState<FileData | undefined>(undefined);
    const [regime, setRegime] = useState<FileRegime>("toProcess");

    return (
        <FileDataContext.Provider
            value={{ fileData, setFileData, regime, setRegime }}
        >
            {children}
        </FileDataContext.Provider>
    );
}
