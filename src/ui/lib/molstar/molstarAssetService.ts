import { Asset } from "molstar/lib/mol-util/assets";
import { getMolstar } from "./instance";
import { arcpUri, generateArchiveID } from "./utils";
import { type SerializedAssets } from "./types";

/**
 * Extracts all "mvsx-file" tagged assets from the asset manager into plain transferable data.
 * @returns serialized assets
 */
export async function serializeMVSXAssets(): Promise<SerializedAssets> {
    const molstar = getMolstar();

    const entries: SerializedAssets["entries"] = [];

    for (const entry of molstar.managers.asset.assets) {
        if (!Asset.isUrl(entry.asset)) continue;

        const data = new Uint8Array(await entry.file.arrayBuffer());
        entries.push({
            asset: { kind: "url", id: entry.asset.id, url: entry.asset.url },
            isStatic: entry.isStatic,
            data,
        });
    }

    return { entries };
}

/**
 * Add new local asset into Molstar asset manager.
 * @param file file
 * @param relativePath e.g. "volumes/seg/"
 * @returns `undefined` if there if already asset present
 */
export function addLocalAssetIntoMolstar(file: FileData, relativePath: string) {
    const molstar = getMolstar();

    const fullPath = relativePath
        ? `${relativePath.replace(/\/+$/, "")}/${file.name}`
        : file.name;

    const url = arcpUri(generateArchiveID(), fullPath);
    const asset = Asset.getUrlAsset(molstar.managers.asset, url);

    if (molstar.managers.asset.has(asset)) {
        return undefined;
    }

    const browserFile = new File([file.content], file.name, {
        type: file.binary ? "application/octet-stream" : "text/plain",
    });

    molstar.managers.asset.set(asset, browserFile, {
        isStatic: true,
        tag: "mvsx-file",
    });

    return { asset, url };
}

/**
 * Adds remote asset into Molstat's asset manager.
 * @param url remote url
 * @returns added Asset.Url object
 */
export function addRemoteAssetIntoMolstar(url: string) {
    const molstar = getMolstar();

    const asset = Asset.Url(url);
    molstar.managers.asset.set(asset, new File([], url), {
        isStatic: false,
        tag: undefined,
    });

    return { asset };
}

/**
 * Removes given asset form the manager.
 * @param asset asset to delete
 */
export function removeAssetFromMolstar(asset: Asset) {
    const molstar = getMolstar();

    const entry = molstar.managers.asset.get(asset);
    if (!entry) return;

    molstar.managers.asset.delete(entry.asset);
}

/**
 * Replaces relarive path in `arcp` URI by new path.
 * @param asset asset
 * @param newRelativeFilePath new path
 * @returns undefined if given asset is not found, otherwise new asset and new url
 */
export function replaceAssetRelativePathFromMolstar(
    asset: Asset.Url,
    newRelativeFilePath: string,
) {
    const molstar = getMolstar();

    const entry = molstar.managers.asset.get(asset);
    if (!entry) return undefined;

    const file = entry.file as File;

    molstar.managers.asset.release(asset);

    const newUrl = arcpUri(generateArchiveID(), newRelativeFilePath);
    const newAsset = Asset.getUrlAsset(molstar.managers.asset, newUrl);

    if (molstar.managers.asset.has(newAsset)) {
        return undefined;
    }

    molstar.managers.asset.set(newAsset, file, {
        isStatic: true,
        tag: "mvsx-file",
    });

    return { asset: newAsset, url: newUrl };
}

/**
 * Ensures that a specific URL (typically an `arcp://` URI) is registered in the
 * Molstar AssetManager by pre-loading it with provided data.
 *
 * @param url unique identifier for the asset
 * @param data raw file data as a Uint8Array
 * @param options configuration for how the asset is stored
 */
export function ensureUrlAsset(
    url: string,
    data: Uint8Array<ArrayBuffer>,
    options?: { isFile?: boolean },
) {
    const molstar = getMolstar();
    const manager = molstar.managers.asset;
    const asset = Asset.getUrlAsset(manager, url);

    if (!manager.has(asset)) {
        const filename = url.split("/").pop() ?? "file";
        manager.set(
            asset,
            new File([data], filename),
            options?.isFile ? { isStatic: true, tag: "mvsx-file" } : undefined,
        );
    }

    return asset;
}
