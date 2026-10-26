/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { create } from "zustand";
import { loggerUi } from "../services/UiLoggingService";

type FileMappingsStore = {
    /**
     * Mapping of managed asset ID -> resolved local file path, loaded from `fileMappings.json` in the user data folder.
     */
    mappings: Record<string, string>;

    /**
     * Loads the mappings from disk (typically once at application start).
     */
    loadMappings: () => Promise<void>;

    /**
     * Resolves and persists the mapping for a newly loaded asset and returns the resolved path.
     * Files smaller than the copy threshold are copied into `Processing/Files`, bigger files reference the original path.
     * @param assetId ID of the newly created managed asset
     * @param originalFilePath absolute path of the original file
     * @returns resolved path, or undefined when the mapping could not be created
     */
    resolveAndStoreMapping: (
        assetId: AssetId,
        originalFilePath: string,
    ) => Promise<string | undefined>;

    /**
     * Stores the data of a managed asset (e.g. extracted from an MVSX archive) into
     * `Processing/Files` and persists the mapping. Used when there is no original
     * file on disk.
     * @param assetId ID of the newly created managed asset
     * @param data content of the asset
     * @param extension extension of the asset without dot, e.g. "mrc"
     * @returns resolved path, or undefined when the mapping could not be created
     */
    storeMappingFromData: (
        assetId: AssetId,
        data: ArrayBuffer,
        extension: string,
    ) => Promise<string | undefined>;

    /**
     * Removes a mapping for given asset ID.
     */
    removeMapping: (assetId: AssetId) => Promise<void>;

    /**
     * Returns the resolved path for given asset ID, or undefined if not found.
     */
    getPath: (assetId: AssetId) => string | undefined;
};

export const useFileMappingsStore = create<FileMappingsStore>((set, get) => ({
    mappings: {},

    loadMappings: async () => {
        const result = await window.electron.getFileMappings();

        if (result instanceof Error) {
            loggerUi.error(
                `Failed to load file mappings! Details: <${result.message}>.`,
            );
            return;
        }

        set({ mappings: result });
    },

    resolveAndStoreMapping: async (assetId, originalFilePath) => {
        const result = await window.electron.resolveAndStoreFileMapping(
            assetId,
            originalFilePath,
        );

        if (result instanceof Error) {
            loggerUi.error(
                `Failed to resolve file mapping for asset <${assetId}>! Details: <${result.message}>.`,
            );
            return undefined;
        }

        set((state) => ({
            mappings: { ...state.mappings, [assetId]: result },
        }));

        return result;
    },

    storeMappingFromData: async (assetId, data, extension) => {
        const result = await window.electron.storeFileMappingFromData(
            assetId,
            data,
            extension,
        );

        if (result instanceof Error) {
            loggerUi.error(
                `Failed to store file mapping for asset <${assetId}>! Details: <${result.message}>.`,
            );
            return undefined;
        }

        set((state) => ({
            mappings: { ...state.mappings, [assetId]: result },
        }));

        return result;
    },

    removeMapping: async (assetId) => {
        const result = await window.electron.removeFileMapping(assetId);

        if (result instanceof Error) {
            loggerUi.error(
                `Failed to remove file mapping for asset <${assetId}>! Details: <${result.message}>.`,
            );
            return;
        }

        set((state) => {
            const newMappings = { ...state.mappings };
            delete newMappings[assetId];
            return { mappings: newMappings };
        });
    },

    getPath: (assetId) => {
        return get().mappings[assetId];
    },
}));
