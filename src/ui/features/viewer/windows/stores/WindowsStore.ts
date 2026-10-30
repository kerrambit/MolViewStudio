/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { create } from "zustand";

/**
 * Windows (sidebars, panels, ...) in the viewer page, which can be opened/closed in the viewer.
 */
export type ViewerWindowId = "processing-jobs" | "scene-manager";

export type WindowsStore = {
    /**
     * Currently opened windows.
     */
    openedWindows: Set<ViewerWindowId>;

    isWindowOpened: (windowId: ViewerWindowId) => boolean;
    openWindow: (windowId: ViewerWindowId) => void;
    closeWindow: (windowId: ViewerWindowId) => void;
    toggleWindow: (windowId: ViewerWindowId) => void;
};

export const useWindowsStore = create<WindowsStore>((set, get) => ({
    openedWindows: new Set<ViewerWindowId>(["scene-manager"]),

    isWindowOpened: (windowId) => get().openedWindows.has(windowId),

    openWindow: (windowId) => {
        const currentWindows = get().openedWindows;
        if (currentWindows.has(windowId)) {
            return;
        }
        set({ openedWindows: new Set(currentWindows).add(windowId) });
    },

    closeWindow: (windowId) => {
        const currentWindows = get().openedWindows;
        if (!currentWindows.has(windowId)) {
            return;
        }
        const newWindows = new Set(currentWindows);
        newWindows.delete(windowId);
        set({ openedWindows: newWindows });
    },

    toggleWindow: (windowId) => {
        const currentWindows = get().openedWindows;
        const newWindows = new Set(currentWindows);
        if (newWindows.has(windowId)) {
            newWindows.delete(windowId);
        } else {
            newWindows.add(windowId);
        }
        set({ openedWindows: newWindows });
    },
}));
