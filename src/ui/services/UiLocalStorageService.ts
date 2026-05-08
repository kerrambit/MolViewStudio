const PENDING_SCREENSHOT_PREFIX = "wants-screenshot-";

export const UiLocalStorageService = {
    /**
     * Retrieves the saved screenshot preference for a specific view.
     * Returns false if no preference is saved.
     */
    getPendingScreenshot: (viewKey: string): boolean => {
        const value = localStorage.getItem(
            `${PENDING_SCREENSHOT_PREFIX}${viewKey}`,
        );
        return value === "true";
    },

    /**
     * Saves the screenshot preference for a specific view.
     */
    setPendingScreenshot: (viewKey: string, wantsScreenshot: boolean): void => {
        localStorage.setItem(
            `${PENDING_SCREENSHOT_PREFIX}${viewKey}`,
            String(wantsScreenshot),
        );
    },

    /**
     * Clears the preference (useful if a view is deleted!)
     */
    clearPendingScreenshot: (viewKey: string): void => {
        localStorage.removeItem(`${PENDING_SCREENSHOT_PREFIX}${viewKey}`);
    },
};
