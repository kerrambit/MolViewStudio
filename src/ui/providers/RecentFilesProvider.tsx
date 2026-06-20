import { createContext, useContext, useState, type ReactNode } from "react";

export type RecentFilesContextType = {
    recentFiles: string[],
    addRecentFile: (path: string) => void
};

export const RecentFilesContext = createContext<
    RecentFilesContextType | undefined
>(undefined);

export function useRecentFiles() {
    const context = useContext(RecentFilesContext);
    if (!context) {
        throw new Error("Recent files must be used within a RecentFilesProvider!");
    }
    return context;
}

export function RecentFilesProvider({ children }: { children: ReactNode }) {
    const [recentFiles, setRecentFiles] = useState<string[]>(() => {
        const uniqueFiles = [...new Set(window.electron.getRecentFiles())];
        return uniqueFiles.slice(0, 10); // TODO: set the limit in Settings
    });

    const addRecentFile = (path: string) => {
        setRecentFiles((prev) => {
            const filtered = prev.filter((p) => p !== path);
            return [path, ...filtered].slice(0, 10); // TODO: set the limit in Settings
        });
        window.electron.addRecentFile(path);
    };

    return (
        <RecentFilesContext.Provider
            value={{
               recentFiles,
               addRecentFile
            }}
        >
            {children}
        </RecentFilesContext.Provider>
    );
}