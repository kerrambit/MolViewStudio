/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { create } from "zustand";

const RECENT_FILES_LIMIT = 10; // TODO: set the limit in Settings

export type RecentFilesStore = {
    recentFiles: string[];
    addRecentFile: (path: string) => void;
};

function getInitialRecentFiles() {
    const uniqueFiles = [...new Set(window.electron.getRecentFiles())];
    return uniqueFiles.slice(0, RECENT_FILES_LIMIT);
}

export const useRecentFilesStore = create<RecentFilesStore>((set) => ({
    recentFiles: getInitialRecentFiles(),

    addRecentFile: (path: string) => {
        set((state) => {
            const filtered = state.recentFiles.filter((p) => p !== path);
            return {
                recentFiles: [path, ...filtered].slice(0, RECENT_FILES_LIMIT),
            };
        });
        window.electron.addRecentFile(path);
    },
}));
