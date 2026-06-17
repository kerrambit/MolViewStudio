import {
    createContext,
    useContext,
    useState,
    useCallback,
    type ReactNode,
} from "react";
import "../i18n";
import {
    addLocalAssetIntoMolstar,
    addRemoteAssetIntoMolstar,
    removeAssetFromMolstar,
    replaceAssetRelativePathFromMolstar,
} from "../lib/molstar";

type ManagedAssetsContextType = {
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
     */
    addLocalAsset: (file: FileData, relativeUrl: string) => boolean;

    /**
     * Adds new remote asset into the system and the Molstar inner repository.
     * @param url url, e.g. https://molstar.org/mol-view-spec-docs/files/1h9t.mvsx.
     */
    addRemoteAsset: (url: string) => void;

    /**
     * Tries to remove the asset from both local system and Molstar inner repository.
     * @param url url of asset to delete
     * @returns false if the url is not found in the map, true if url was found and asset was removed from both places
     */
    removeAsset: (url: string) => boolean;

    /**
     * Edits relative path of local asset.
     * Beware that original object is deleted both from map and Molstar!
     * @param url url of asset
     * @param newRelativePath new relative path (e.g. "volumes/segments/", or "" for no folders)
     * @returns false if given url does not exist, otherwise true
     */
    editRelativePathOfLocalAsset: (
        url: string,
        newRelativePath: string,
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
     * Clears all assets from local system.
     * Does NOT clear Molstar inner repository!
     */
    clearAssets: () => void;

    /**
     * Returns all local `ManagedAsset` objects from the map as an array.
     * @returns `ManagedAsset` objects from the map as an array
     */
    getAllLocalAssets: () => ManagedAsset[];

    /**
     * Returns all remote `ManagedAsset` objects from the map as an array.
     * @returns `ManagedAsset` objects from the map as an array
     */
    getAllRemoteAssets: () => ManagedAsset[];

    /**
     * Returns all `ManagedAsset` objects from the map as an array.
     * @returns `ManagedAsset` objects from the map as an array
     */
    getAllAssets: () => ManagedAsset[];

    /**
     * Returns `ManagedAsset` object with given ID.
     * @returns `ManagedAsset` object or undefined if asset with ID is not found
     */
    getAsset: (assetId: string) => ManagedAsset | undefined;
};

export const ManagedAssetsContext =
    createContext<ManagedAssetsContextType | null>(null);

export function useManagedAssets() {
    const context = useContext(ManagedAssetsContext);
    if (!context) {
        throw new Error(
            "ManagedAssets must be used within ManagedAssetsProvider!",
        );
    }
    return context;
}

export function ManagedAssetsProvider({ children }: { children: ReactNode }) {
    const [assets, setAssets] = useState<Map<string, ManagedAsset>>(new Map());

    const addAsset = useCallback((asset: ManagedAsset): void => {
        setAssets((prev) => {
            const key = asset.asset.url;
            if (prev.has(key)) {
                return prev;
            }
            const newMap = new Map(prev);
            newMap.set(key, asset);
            return newMap;
        });
    }, []);

    const addLocalAsset = useCallback(
        (file: FileData, relativePath: string): boolean => {
            const result = addLocalAssetIntoMolstar(file, relativePath);

            if (!result) {
                return false;
            }

            const entry: ManagedAsset = {
                id: crypto.randomUUID(),
                asset: result.asset,
                relativePath: `${relativePath}${file.name}`,
                tag: "local",
                name: file.name,
                useCount: 0,
            };

            setAssets((prev) => new Map(prev).set(result.url, entry));
            return true;
        },
        [],
    );

    const addRemoteAsset = useCallback((url: string): void => {
        const { asset } = addRemoteAssetIntoMolstar(url);

        const entry: ManagedAsset = {
            id: crypto.randomUUID(),
            asset,
            relativePath: url,
            tag: "remote",
            name: url,
            useCount: 0,
        };

        setAssets((prev) => new Map(prev).set(url, entry));
    }, []);

    const removeAsset = useCallback(
        (url: string) => {
            const asset: ManagedAsset | undefined = assets.get(url);
            if (!asset) {
                return false;
            }

            removeAssetFromMolstar(asset.asset);

            setAssets((prev) => {
                const next = new Map(prev);
                next.delete(url);
                return next;
            });

            return true;
        },
        [assets],
    );

    const editRelativePathOfLocalAsset = useCallback(
        (url: string, newRelativePath: string): boolean => {
            if (!assets.has(url)) return false;

            const existingAsset = assets.get(url)!;
            if (existingAsset.tag !== "local") return false;

            const newFullPath = `${newRelativePath}${existingAsset.name}`;
            if (existingAsset.relativePath === newFullPath) return false;

            const result = replaceAssetRelativePathFromMolstar(
                existingAsset.asset,
                newFullPath,
            );

            if (!result) {
                return false;
            }

            setAssets((prev) => {
                const newMap = new Map(prev);

                newMap.delete(url);

                newMap.set(result.url, {
                    ...existingAsset,
                    asset: result.asset,
                    relativePath: newFullPath,
                });

                return newMap;
            });

            return true;
        },
        [assets],
    );

    const incrementAssetUseCount = useCallback(
        (url: string): boolean => {
            if (!assets.has(url)) return false;

            setAssets((prev) => {
                const existingAsset = prev.get(url);
                if (!existingAsset) return prev;

                const newMap = new Map(prev);
                newMap.set(url, {
                    ...existingAsset,
                    useCount: existingAsset.useCount + 1,
                });

                return newMap;
            });

            return true;
        },
        [assets],
    );

    const decrementAssetUseCount = useCallback(
        (url: string): boolean => {
            if (!assets.has(url)) return false;

            setAssets((prev) => {
                const existingAsset = prev.get(url);

                if (!existingAsset || existingAsset.useCount === 0) return prev;

                const newMap = new Map(prev);
                newMap.set(url, {
                    ...existingAsset,
                    useCount: existingAsset.useCount - 1,
                });

                return newMap;
            });

            return true;
        },
        [assets],
    );

    const clearAssets = useCallback(() => {
        setAssets(new Map());
    }, []);

    const getAllLocalAssets = useCallback((): ManagedAsset[] => {
        return Array.from(assets.values()).filter((e) => e.tag === "local");
    }, [assets]);

    const getAllRemoteAssets = useCallback((): ManagedAsset[] => {
        return Array.from(assets.values()).filter((e) => e.tag === "remote");
    }, [assets]);

    const getAllAssets = useCallback((): ManagedAsset[] => {
        return Array.from(assets.values());
    }, [assets]);

    const getAsset = useCallback(
        (assetId: string): ManagedAsset | undefined => {
            for (const asset of assets.values()) {
                if (asset.id === assetId) {
                    return asset;
                }
            }
            return undefined;
        },
        [assets],
    );

    return (
        <ManagedAssetsContext.Provider
            value={{
                assets,
                addAsset,
                addLocalAsset,
                addRemoteAsset,
                removeAsset,
                editRelativePathOfLocalAsset,
                incrementAssetUseCount,
                decrementAssetUseCount,
                clearAssets,
                getAllLocalAssets,
                getAllRemoteAssets,
                getAllAssets,
                getAsset,
            }}
        >
            {children}
        </ManagedAssetsContext.Provider>
    );
}
