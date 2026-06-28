import { pushErrorNotification } from "./NotificationService";
import { loggerUi } from "./UiLoggingService";

const PREFIX = {
    PENDING_SCREENSHOT: "view-options-wants-screenshot-",
    SCENE_MANAGER_TAB: "scene-manager-tab-",
    SCENE_MANAGER_BUILDER_SIDEBAR: "scene-manager-builder-sidebar",
    VIEW_BUILDER_ASSET: "view-builder-expanded-asset-",
    VIEW_BUILDER_TAB: "view-builder-tab-",
    VIEW_BUILDER_FILTER_SECTION: "view-builder-asset-filter-section-",
    VIEW_BUILDER_FILTERS: "view-builder-asset-filters-",
    VIEW_BUILDER_FOLDER: "view-builder-asset-folders-",
    ASSETS_TREE: "assets-tree-",
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

        getAssetFilters: (viewKey: string): string[] | null => {
            const stored = localStorage.getItem(
                `${PREFIX.VIEW_BUILDER_FILTERS}${viewKey}`,
            );

            if (!stored) return null;

            try {
                return JSON.parse(stored) as string[];
            } catch (error) {
                pushErrorNotification(
                    `Internal error occured concerning reading the stored UI state!`,
                );
                loggerUi.error(
                    `Failed to parse asset filters from localStorage! Details: <${error}>.`,
                );
                return null;
            }
        },

        setAssetFilters: (viewKey: string, filters: string[]): void => {
            localStorage.setItem(
                `${PREFIX.VIEW_BUILDER_FILTERS}${viewKey}`,
                JSON.stringify(filters),
            );
        },

        getAssetFolders: (viewKey: string): string[] | null => {
            const stored = localStorage.getItem(
                `${PREFIX.VIEW_BUILDER_FOLDER}${viewKey}`,
            );

            if (!stored) return null;

            try {
                return JSON.parse(stored) as string[];
            } catch (error) {
                pushErrorNotification(
                    `Internal error occured concerning reading the stored UI state!`,
                );
                loggerUi.error(
                    `Failed to parse asset folders from localStorage! Details: <${error}>.`,
                );
                return null;
            }
        },

        setAssetFolders: (viewKey: string, folders: string[]): void => {
            localStorage.setItem(
                `${PREFIX.VIEW_BUILDER_FOLDER}${viewKey}`,
                JSON.stringify(folders),
            );
        },

        getExpandedFiltersSection: (viewKey: string): boolean => {
            const result = localStorage.getItem(
                `${PREFIX.VIEW_BUILDER_FILTER_SECTION}${viewKey}`,
            );
            if (result) {
                return result === "true";
            }
            return true;
        },

        setExpandedFiltersSection: (
            viewKey: string,
            isExpanded: boolean,
        ): void => {
            if (isExpanded) {
                localStorage.setItem(
                    `${PREFIX.VIEW_BUILDER_FILTER_SECTION}${viewKey}`,
                    "true",
                );
            } else {
                localStorage.setItem(
                    `${PREFIX.VIEW_BUILDER_FILTER_SECTION}${viewKey}`,
                    "false",
                );
            }
        },
    },
    Assets: {
        getInitialTreeExpandedState: (
            filepath: string,
        ): Record<string, boolean> => {
            try {
                const stored = localStorage.getItem(
                    `${PREFIX.ASSETS_TREE}${filepath}`,
                );
                return stored ? JSON.parse(stored) : {};
            } catch (e) {
                return {};
            }
        },

        setInitialTreeExpandedState: (
            filepath: string,
            state: Record<string, boolean>,
        ) => {
            localStorage.setItem(
                `${PREFIX.ASSETS_TREE}${filepath}`,
                JSON.stringify(state),
            );
        },
    },
};
