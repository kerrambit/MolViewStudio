/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { create } from "zustand";
import "../../../i18n";
import {
    addLocalAssetIntoMolstar,
    addRemoteAssetIntoMolstar,
    removeAssetFromMolstar,
    replaceAssetRelativePathFromMolstar,
} from "../../../lib/molstar";
import { getExtensionFromFileName } from "../../../utils/fileDataUtils";
import { loggerUi } from "../../logger/services/UiLoggingService";

export function isManagedAssetLocal(managedAsset: ManagedAsset): boolean {
    return managedAsset.tag === "local";
}

export function isManagedAssetRemote(managedAsset: ManagedAsset): boolean {
    return managedAsset.tag === "remote";
}

type ManagedAssetsStore = {
    /**
     * Keys are URL in `arcp` protocol of assets as stored in Molstar Asset Manager.
     * Values are our `ManagedAsset` objects.
     */
    assets: Map<string, ManagedAsset>;

    /**
     * Add new asset into map. If key already exists, skips.
     * @param asset asset to add
     */
    addAsset: (asset: ManagedAsset) => void;

    /**
     * Adds new local asset into the system and the Molstar inner repository.
     *
     * @param file file to add
     * @param relativeUrl relative URL to the asset (in this format: "volumes/first_section/", or "" for current path as relative path)
     * @param type type of asset
     * @param isHidden hidden assets are not shown in the assets sidebar or view builder and are not exported, e.g. preview assets created by downsampling, default is false
     * @returns the created `ManagedAsset`, or undefined if the asset already exists
     */
    addLocalAsset: (
        file: FileData,
        relativeUrl: string,
        type: ManagedAssetType,
        isHidden?: boolean,
    ) => ManagedAsset | undefined;

    /**
     * Adds new local asset into the system and the Molstar inner repository.
     *
     * @param file file to add
     * @param relativeUrl relative URL to the asset (in this format: "volumes/first_section/", or "" for current path as relative path)
     * @param name explicit name (`data.bcif`) with an extension
     * @param type type of asset
     * @param isHidden hidden assets are not shown in the assets sidebar or view builder and are not exported, e.g. preview assets created by downsampling, default is false
     * @returns the created `ManagedAsset`, or undefined if the asset already exists
     */
    addLocalAssetWithExplicitName: (
        file: FileData,
        relativeUrl: string,
        name: string,
        type: ManagedAssetType,
        isHidden?: boolean,
    ) => ManagedAsset | undefined;

    /**
     * Adds new remote asset into the system and the Molstar inner repository.
     * @param url url, e.g. https://molstar.org/mol-view-spec-docs/files/1h9t.mvsx.
     * @param extension dermines the extension of the data
     * @param type type of asset
     */
    addRemoteAsset: (url: string, extension: string, type: ManagedAssetType) => void;

    /**
     * Edits existing remote asset.
     * @param url url of asset
     * @param newUrl new url of asset
     * @param newExtension new extension
     * @param newType new type
     * @returns false if given url does not exist, the new url and extension do not differ, otherwise true
     */
    editRemoteAsset: (
        url: string,
        newUrl: string,
        newExtension: string,
        newType: ManagedAssetType,
    ) => boolean;

    /**
     * Tries to remove the asset from both local system and Molstar inner repository.
     * @param url url of asset to delete
     * @returns false if the url is not found in the map, true if url was found and asset was removed from both places
     */
    removeAsset: (url: string) => boolean;

    /**
     * Edits relative path and file name of local asset.
     * Beware that original object is deleted both from map and Molstar!
     * @param url url of asset
     * @param newFilenameWithExtension new filename with its extensions
     * @param newRelativePath new relative path (e.g. "volumes/segments/", or "" for no folders)
     * @param newType new type of asset
     * @returns false if given url does not exist, otherwise true
     */
    editLocalAsset: (
        url: string,
        newFilenameWithExtension: string,
        newRelativePath: string,
        newType: ManagedAssetType,
    ) => boolean;

    /**
     * Increments the reference counter for a given asset.
     * @param url url of the asset
     * @returns false if the asset was not found, true if successfully updated
     */
    incrementAssetUseCount: (url: string) => boolean;

    /**
     * Decrements the reference counter for a given asset. Will not drop below 0.
     * @param url url of the asset
     * @returns false if the asset was not found, true if successfully updated
     */
    decrementAssetUseCount: (url: string) => boolean;

    /**
     * Returns a snapshot map of all managed assets' use counts, keyed by asset URL.
     * @returns a new `Map` of asset URL → useCount
     */
    getAssetUseCounts: () => Map<string, number>;

    /**
     * Overwrites the useCount of managed assets based on a given map of URL → useCount.
     * Only assets whose URL exists as a key in `counts` are updated; any assets not
     * present in `counts` are left unchanged. URLs in `counts` that don't correspond
     * to any existing asset are silently ignored.
     * @param counts map of asset URL → new useCount
     */
    setAssetUseCounts: (counts: Map<string, number>) => void;

    /**
     * Clears all assets from local system.
     * Does NOT clear Molstar inner repository!
     */
    clearAssets: () => void;

    /**
     * Returns `ManagedAsset` object with given ID.
     * @returns `ManagedAsset` object or undefined if asset with ID is not found
     */
    getAsset: (assetId: string) => ManagedAsset | undefined;

    /**
     * Attaches a processing job to a managed asset by appending the job ID into its `processingJobIds`.
     * @param assetId ID of the managed asset
     * @param jobId ID of the processing job
     * @returns false if the asset was not found or the job is already attached, true otherwise
     */
    attachProcessingJob: (assetId: string, jobId: string) => boolean;

    /**
     * Detaches a processing job from a managed asset by removing the job ID from its `processingJobIds`.
     * @param assetId ID of the managed asset
     * @param jobId ID of the processing job
     * @returns false if the asset was not found, true otherwise
     */
    detachProcessingJob: (assetId: string, jobId: string) => boolean;

    /**
     * Attaches a child asset (e.g. a downsampled preview) to a parent managed asset.
     * @param parentAssetId ID of the parent managed asset
     * @param childAssetId ID of the child managed asset
     * @param kind kind of the child asset
     * @returns false if the parent was not found or the child is already attached, true otherwise
     */
    attachChildAsset: (
        parentAssetId: string,
        childAssetId: string,
        kind: ManagedAssetChildKind,
    ) => boolean;
};

export const useManagedAssetsStore = create<ManagedAssetsStore>((set, get) => ({
    assets: new Map(),

    addAsset: (asset) => {
        const key = asset.asset.url;
        const currentAssets = get().assets;

        if (currentAssets.has(key)) {
            return;
        }

        const newMap = new Map(currentAssets);
        newMap.set(key, asset);
        set({ assets: newMap });
    },

    addLocalAsset: (file, relativePath, type, isHidden = false) => {
        const result = addLocalAssetIntoMolstar(file, relativePath);

        if (!result) {
            return undefined;
        }

        const entry: ManagedAsset = {
            id: crypto.randomUUID(),
            asset: result.asset,
            type: type,
            relativePath: `${relativePath}${file.name}`,
            tag: "local",
            name: file.name,
            useCount: 0,
            extension: getExtensionFromFileName(file.name) || "unknown",
            hidden: isHidden,
            processingJobIds: [],
            children: [],
        };

        const newMap = new Map(get().assets);
        newMap.set(result.url, entry);
        set({ assets: newMap });

        return entry;
    },

    addLocalAssetWithExplicitName: (file, relativePath, name, type, isHidden = false) => {
        const result = addLocalAssetIntoMolstar(file, relativePath, name);

        if (!result) {
            return undefined;
        }

        const entry: ManagedAsset = {
            id: crypto.randomUUID(),
            asset: result.asset,
            type: type,
            relativePath: `${relativePath.replace(/\/+$/, "")}/${name}`,
            tag: "local",
            name: name,
            useCount: 0,
            extension: getExtensionFromFileName(name) || "unknown",
            hidden: isHidden,
            processingJobIds: [],
            children: [],
        };

        const newMap = new Map(get().assets);
        newMap.set(result.url, entry);
        set({ assets: newMap });

        return entry;
    },

    addRemoteAsset: (url, extension, type) => {
        const { asset } = addRemoteAssetIntoMolstar(url);

        const entry: ManagedAsset = {
            id: crypto.randomUUID(),
            asset,
            type: type,
            relativePath: url,
            tag: "remote",
            name: url,
            useCount: 0,
            extension: extension,
            hidden: false,
            processingJobIds: [],
            children: [],
        };

        const newMap = new Map(get().assets);
        newMap.set(url, entry);
        set({ assets: newMap });
    },

    editRemoteAsset: (url, newUrl, newExtension, newType) => {
        const currentAssets = get().assets;

        if (!currentAssets.has(url)) return false;

        const existingAsset = currentAssets.get(url)!;
        if (existingAsset.tag !== "remote") {
            return false;
        }
        if (
            existingAsset.asset.url === newUrl &&
            existingAsset.extension === newExtension &&
            existingAsset.type == newType
        ) {
            return false;
        }

        let newAsset = existingAsset.asset;
        if (existingAsset.asset.url !== newUrl) {
            removeAssetFromMolstar(existingAsset.asset);
            const { asset } = addRemoteAssetIntoMolstar(newUrl);
            newAsset = asset;
        }

        const newMap = new Map(currentAssets);
        newMap.delete(url);
        newMap.set(newUrl, {
            ...existingAsset,
            asset: newAsset,
            type: newType,
            relativePath: newUrl,
            name: newUrl,
            extension: newExtension,
        });

        set({ assets: newMap });
        return true;
    },

    removeAsset: (url) => {
        const currentAssets = get().assets;
        const asset = currentAssets.get(url);

        if (!asset) {
            return false;
        }

        removeAssetFromMolstar(asset.asset);

        const newMap = new Map(currentAssets);
        newMap.delete(url);
        set({ assets: newMap });

        return true;
    },

    editLocalAsset: (url, newFilenameWithExtension, newRelativePath, newType) => {
        const currentAssets = get().assets;

        if (!currentAssets.has(url)) return false;

        const existingAsset = currentAssets.get(url)!;
        if (existingAsset.tag !== "local") {
            return false;
        }

        const newFullPath = `${newRelativePath}${newFilenameWithExtension}`;
        if (existingAsset.relativePath === newFullPath) return false;

        const result = replaceAssetRelativePathFromMolstar(
            existingAsset.asset,
            newFullPath,
        );

        if (!result) {
            return false;
        }

        const newMap = new Map(currentAssets);
        newMap.delete(url);
        newMap.set(result.url, {
            ...existingAsset,
            asset: result.asset,
            relativePath: newFullPath,
            name: newFilenameWithExtension,
            type: newType,
        });

        set({ assets: newMap });
        return true;
    },

    incrementAssetUseCount: (url) => {
        const currentAssets = get().assets;

        if (!currentAssets.has(url)) return false;

        const existingAsset = currentAssets.get(url)!;
        const newMap = new Map(currentAssets);

        newMap.set(url, {
            ...existingAsset,
            useCount: existingAsset.useCount + 1,
        });

        set({ assets: newMap });
        return true;
    },

    decrementAssetUseCount: (url) => {
        const currentAssets = get().assets;

        if (!currentAssets.has(url)) return false;

        const existingAsset = currentAssets.get(url)!;
        if (existingAsset.useCount === 0) return false;

        const newMap = new Map(currentAssets);
        newMap.set(url, {
            ...existingAsset,
            useCount: existingAsset.useCount - 1,
        });

        set({ assets: newMap });
        return true;
    },

    getAssetUseCounts: () => {
        const currentAssets = get().assets;
        const counts = new Map<string, number>();

        for (const [url, asset] of currentAssets) {
            counts.set(url, asset.useCount);
        }

        return counts;
    },

    setAssetUseCounts: (counts) => {
        const currentAssets = get().assets;
        const newMap = new Map(currentAssets);

        for (const [url, newCount] of counts) {
            const existingAsset = newMap.get(url);
            if (!existingAsset) continue;

            newMap.set(url, {
                ...existingAsset,
                useCount: newCount,
            });
        }

        set({ assets: newMap });
    },

    clearAssets: () => {
        set({ assets: new Map() });
        loggerUi.debug("Managed assets were cleared.");
    },

    getAsset: (assetId) => {
        for (const asset of get().assets.values()) {
            if (asset.id === assetId) {
                return asset;
            }
        }
        return undefined;
    },

    attachProcessingJob: (assetId, jobId) => {
        const currentAssets = get().assets;
        const existingAsset = get().getAsset(assetId);

        if (!existingAsset) {
            return false;
        }

        if (existingAsset.processingJobIds.includes(jobId)) {
            return false;
        }

        const newMap = new Map(currentAssets);
        newMap.set(existingAsset.asset.url, {
            ...existingAsset,
            processingJobIds: [...existingAsset.processingJobIds, jobId],
        });

        set({ assets: newMap });
        return true;
    },

    detachProcessingJob: (assetId, jobId) => {
        const existingAsset = get().getAsset(assetId);

        if (!existingAsset) {
            return false;
        }

        const newMap = new Map(get().assets);
        newMap.set(existingAsset.asset.url, {
            ...existingAsset,
            processingJobIds: existingAsset.processingJobIds.filter((id) => id !== jobId),
        });

        set({ assets: newMap });
        return true;
    },

    attachChildAsset: (parentAssetId, childAssetId, kind) => {
        const existingAsset = get().getAsset(parentAssetId);

        if (!existingAsset) {
            return false;
        }

        if (existingAsset.children.some((child) => child.id === childAssetId)) {
            return false;
        }

        const newMap = new Map(get().assets);
        newMap.set(existingAsset.asset.url, {
            ...existingAsset,
            children: [...existingAsset.children, { id: childAssetId, kind: kind }],
        });

        set({ assets: newMap });
        return true;
    },
}));
