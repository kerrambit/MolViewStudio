const PREFIX = {
    PENDING_SCREENSHOT: "view-options-wants-screenshot-",
    SCENE_MANAGER_TAB: "scene-manager-tab-",
    SCENE_MANAGER_BUILDER_SIDEBAR: "scene-manager-builder-sidebar",
    VIEW_BUILDER_ASSET: "view-builder-expanded-asset-",
    VIEW_BUILDER_TAB: "view-builder-tab-",
};

export const UiLocalStorageService = {
    clear: () => {
        localStorage.clear();
    },

    ViewOptions: {
        getPending: (viewKey: string): boolean => {
            const value = localStorage.getItem(
                `${PREFIX.PENDING_SCREENSHOT}${viewKey}`,
            );
            return value === "true";
        },

        setPending: (viewKey: string, wantsScreenshot: boolean): void => {
            localStorage.setItem(
                `${PREFIX.PENDING_SCREENSHOT}${viewKey}`,
                String(wantsScreenshot),
            );
        },

        clearPending: (viewKey: string): void => {
            localStorage.removeItem(`${PREFIX.PENDING_SCREENSHOT}${viewKey}`);
        },
    },

    SceneManager: {
        getTab: (): "storyOptions" | "assets" | "views" => {
            const value = localStorage.getItem(`${PREFIX.SCENE_MANAGER_TAB}`);
            return (
                (value as "storyOptions" | "assets" | "views") || "storyOptions"
            );
        },

        setTab: (tabType: "storyOptions" | "assets" | "views"): void => {
            localStorage.setItem(
                `${PREFIX.SCENE_MANAGER_TAB}`,
                String(tabType),
            );
        },

        getBuilderSidebar: (): string | undefined => {
            const value = localStorage.getItem(
                `${PREFIX.SCENE_MANAGER_BUILDER_SIDEBAR}`,
            );
            return value || undefined;
        },

        setBuilderSidebar: (viewKey: string | undefined): void => {
            if (viewKey) {
                localStorage.setItem(
                    `${PREFIX.SCENE_MANAGER_BUILDER_SIDEBAR}`,
                    viewKey,
                );
            } else {
                localStorage.removeItem(
                    `${PREFIX.SCENE_MANAGER_BUILDER_SIDEBAR}`,
                );
            }
        },
    },

    ViewBuilder: {
        getExpandedAssetId: (viewKey: string): string | null => {
            return localStorage.getItem(
                `${PREFIX.VIEW_BUILDER_ASSET}${viewKey}`,
            );
        },

        setExpandedAssetId: (viewKey: string, assetId: string | null): void => {
            if (assetId) {
                localStorage.setItem(
                    `${PREFIX.VIEW_BUILDER_ASSET}${viewKey}`,
                    assetId,
                );
            } else {
                localStorage.removeItem(
                    `${PREFIX.VIEW_BUILDER_ASSET}${viewKey}`,
                );
            }
        },

        getTab: (): "representation" | "volume" => {
            const value = localStorage.getItem(`${PREFIX.VIEW_BUILDER_TAB}`);
            return (value as "representation" | "volume") || "representation";
        },

        setTab: (tabType: "representation" | "volume"): void => {
            localStorage.setItem(`${PREFIX.VIEW_BUILDER_TAB}`, String(tabType));
        },
    },
};
