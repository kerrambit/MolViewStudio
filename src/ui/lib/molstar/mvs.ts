/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import {
    GlobalMetadata,
    MVSData,
    type MVSData_States,
    type Snapshot,
} from "molstar/lib/extensions/mvs/mvs-data";
import { type DownloadAsset, type LoadMVSXFileResult, type ViewMetadata } from "./types";
import { unzip, Zip } from "molstar/lib/mol-util/zip/zip";
import { type Result } from "../../../types/Result";
import { getMolstar } from "./instance";
import { download } from "molstar/lib/mol-util/download";
import { Vec3 } from "molstar/lib/mol-math/linear-algebra/3d";
import { getCameraState, getDefaultCameraState } from "./camera";
import { RuntimeContext, Task } from "molstar/lib/mol-task";
import { arcpUri, decodeUtf8, generateArchiveID } from "./utils";
import { ensureUrlAsset } from "./molstarAssetService";
import { Asset } from "molstar/lib/mol-util/assets";
import { loadMVS } from "molstar/lib/extensions/mvs/load";
import { buildRenderTreeForMolstar } from "./mvsTree";
import { checkMolstarAfterLoading } from "./core";
import { getExtensionFromFileName, getExtensionFromUrl } from "../../utils/fileDataUtils";
import { isExtensionSupported } from "../../features/assets/domain/assetsDefinitions";
import { collectReferencedAssetIds } from "./mvsTree";

/**
 * Retrieves current view index.
 * @returns index or undefined
 */
export function getCurrentViewIndex() {
    const molstar = getMolstar();
    const current = molstar.managers.snapshot.state.current;

    if (current) {
        const entries = molstar.managers.snapshot.state.entries;
        let currentIndex;

        for (let i = 0; i < entries.count(); i++) {
            const entry = entries.get(i);
            if (entry?.snapshot?.id === current) {
                currentIndex = i;
                return currentIndex;
            }
        }
    }
}

/**
 * Creates an archive from index file and assets.
 * @param index index
 * @param assets assets array (already in relative form)
 * @returns binary archive
 */
export async function createMVSArchive(
    index: MVSData,
    assets: DownloadAsset[],
): Promise<Uint8Array<ArrayBuffer>> {
    // Text encoder.
    const encoder = new TextEncoder();

    // Encode all files.
    const files: Record<string, Uint8Array<ArrayBuffer>> = {
        "index.mvsj": encoder.encode(JSON.stringify(index)) as Uint8Array<ArrayBuffer>,
    };

    for (const asset of assets) {
        const pathInZip = asset.relativeUrl.startsWith("./")
            ? asset.relativeUrl.slice(2)
            : asset.relativeUrl;
        files[pathInZip] = asset.content as Uint8Array<ArrayBuffer>;
    }

    // Archive files and return the archive as Uint8Array.
    const zip = await Zip(files).run();
    return new Uint8Array(zip) as Uint8Array<ArrayBuffer>;
}

/**
 * Creates MVS blob out of `data`. Function explores if `data` is just string-like (.mvsj) object or binary archive (.mvsx).
 * @param data data
 * @returns blob of data
 */
export function createMVSBlob(
    data: string | MVSData | Uint8Array<ArrayBuffer> | Uint8Array<ArrayBufferLike>,
): Blob {
    return data instanceof Uint8Array
        ? new Blob([data as Uint8Array<ArrayBuffer>], {
              type: "application/octet-stream",
          })
        : new Blob([JSON.stringify(data, null, 2)], {
              type: "application/json",
          });
}

/**
 * Exports a state tree with possible local assets in the form of MVS.
 * @param stateTreeWithRelativePaths state tree to export (assets referenced by relative paths)
 * @param stateTreeWithIDs the same state tree, but assets referenced by ManagedAsset IDs; used to find which assets are used
 * @param bundleAllLocalAssets if true, all local assets are bundled, including those not used in any view
 * @param localAssets candidate local assets for bundling
 * @param filepath name of the export file (without extension)
 * @param outputPath optional folder to save the export into; when omitted, a browser download is used
 * @return Error if there is an internal error in Molstar asset cache, otherwise it returns true
 */
export async function exportStateTree(
    stateTreeWithRelativePaths: MVSData,
    stateTreeWithIDs: MVSData_States,
    bundleAllLocalAssets: boolean,
    localAssets: ManagedAsset[],
    filepath: string,
    outputPath?: string,
): Promise<Result<boolean>> {
    const molstar = getMolstar();

    // Decide which assets to bundle: everything, or only those whose IDs appear in the state tree.
    const localOnly = localAssets.filter((asset) => asset.tag === "local");
    let assetsToBundle: ManagedAsset[] = localOnly;
    if (!bundleAllLocalAssets) {
        const usedIds = collectReferencedAssetIds(stateTreeWithIDs, localAssets);
        assetsToBundle = localOnly.filter((asset) => usedIds.has(asset.id));
    }

    // Managed assets hold only virtual references; the actual data is stored inside Molstar's asset manager.
    // Index the static files by URL once, instead of scanning the whole cache for every asset.
    const staticFilesByUrl = new Map<string, Blob>();
    for (const wrapper of molstar.managers.asset.assets.values()) {
        if (
            wrapper.asset.kind === "url" &&
            wrapper.isStatic &&
            !staticFilesByUrl.has(wrapper.asset.url)
        ) {
            staticFilesByUrl.set(wrapper.asset.url, wrapper.file);
        }
    }

    // Collect binary data of the assets to bundle.
    const localFiles: DownloadAsset[] = [];
    for (const managedAsset of assetsToBundle) {
        if (managedAsset.tag !== "local") continue; // Narrows the type.

        const targetUrl = managedAsset.asset.url;
        const file = staticFilesByUrl.get(targetUrl);
        if (!file) {
            return {
                success: false,
                error: new Error(
                    `Internal error: failed to find ${targetUrl} inside Molstar's cache! Please, consider reporting this bug.`,
                ),
            };
        }

        localFiles.push({
            relativeUrl: managedAsset.relativePath,
            content: new Uint8Array(await file.arrayBuffer()) as Uint8Array<ArrayBuffer>,
        });
    }

    // Prepare state tree (either MVSData if .mvsj, otherwise Uint8Array<ArrayBuffer> for .mvsx).
    let data: MVSData | Uint8Array<ArrayBuffer> = stateTreeWithRelativePaths;
    if (localFiles.length > 0) {
        data = await createMVSArchive(stateTreeWithRelativePaths, localFiles);
    }

    // Create data blob out of MVSStory.
    const blob = createMVSBlob(data);

    // Let the user download the story or save it into the chosen output folder.
    const filename = `${filepath}.${data instanceof Uint8Array ? "mvsx" : "mvsj"}`;
    if (outputPath) {
        const arrayBuffer = await blob.arrayBuffer();
        const saveResult = await window.electron.saveData(
            arrayBuffer,
            `${outputPath}/${filename}`,
        );
        if (saveResult instanceof Error) {
            return { success: false, error: saveResult };
        }
    } else {
        download(blob, filename); // TODO: can we create our own download function to verify if user clicked on Cancel before exporting?
    }

    return { success: true, value: true };
}

/**
 * Extracts views metadata from the MVS (both `single` and `mutliple` kind).
 * The extraction for `single` kind (which does not have any explicit snapshtos) is done by creating new view (snapshot) by applying:
 *  - if there is a global story title, use it as well as new view title
 *  - if there is a global story description (and description format), use it as well as new view description (and description format)
 *  - otherwise, leave properties as undefined or default values.
 * @param mvsData MVS
 * @returns array of views metadata
 */
export function extractViewsFromMVS(mvsData: MVSData): ViewMetadata[] {
    let snapshots: Snapshot[] = [];
    if (mvsData.kind !== "multiple") {
        const snapshot = {
            root: mvsData.root,
            metadata: {
                title: mvsData.metadata.title,
                description: mvsData.metadata.description,
                description_format: mvsData.metadata.description_format,
                key: undefined,
                linger_duration_ms: 5000,
                transition_duration_ms: undefined,
            },
        };
        snapshots.push(snapshot);
    } else {
        snapshots = mvsData.snapshots;
    }

    const views: ViewMetadata[] = [];

    snapshots.forEach((snapshot) => {
        const { root, metadata } = snapshot;

        const cameraNode = root.children?.find((node) => node.kind === "camera");

        type CameraParams = {
            target: [number, number, number] | Vec3;
            position: [number, number, number] | Vec3;
            up: [number, number, number] | Vec3;
        };

        const cameraParams = cameraNode?.params as CameraParams | undefined;
        const currentState = getCameraState() || getDefaultCameraState();

        const canvasNode = root.children?.find((node) => node.kind === "canvas");

        type CanvasParams = {
            background_color: string;
        };

        const canvasParams = canvasNode?.params as CanvasParams | undefined;

        const view: ViewMetadata = {
            id: metadata.key ?? crypto.randomUUID(),
            key: metadata.key,
            description: metadata.description,
            description_format: metadata.description_format,
            title: metadata.title,
            referenceCamera: cameraParams
                ? {
                      position: cameraParams.position || currentState.position,
                      target: cameraParams.target || currentState.target,
                      up: cameraParams.up || currentState.up,
                      fov: currentState.fov,
                      mode: currentState.mode,
                  }
                : undefined,
            thumbnail: cameraNode?.custom?.thumbnail,
            backgroundColor: canvasParams?.background_color,
            linger_duration_ms: 5000,
            transition_duration_ms: metadata.transition_duration_ms,
        };

        views.push(view);
    });

    return views;
}

/**
 * Retrieves all download urls from snapshot.
 * @param snapshot snapshot
 * @returns list of urls
 */
export function getAllDownloadUrlsFromSnapshot(snapshot: Snapshot): string[] {
    const urls: string[] = [];
    if (!snapshot || !snapshot.root || !snapshot.root.children) return urls;

    snapshot.root.children.forEach((child) => {
        if (child.kind === "download" && child.params?.url) {
            urls.push(child.params.url);
        }
    });
    return urls;
}

/**
 * Extracts all urls/uris from MVS.
 * @param mvsData MVS to analyze
 * @returns set of unique urls/uris from MVS
 */
export function extractUrlsFromMVS(mvsData: MVSData): Set<string> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let snapshots: any[] = [];

    if (mvsData.kind !== "multiple") {
        snapshots.push({ root: mvsData.root, metadata: mvsData.metadata });
    } else {
        snapshots = mvsData.snapshots;
    }

    const urls = new Set<string>();
    const normalizePath = (path: string) =>
        path.startsWith("./") ? path.slice(2) : path;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const traverseNode = (node: any) => {
        if (node.params) {
            if (typeof node.params.url === "string") {
                urls.add(normalizePath(node.params.url));
            }
            if (typeof node.params.uri === "string") {
                urls.add(normalizePath(node.params.uri));
            }
        }

        if (node.children && Array.isArray(node.children)) {
            for (const child of node.children) {
                traverseNode(child);
            }
        }
    };

    snapshots.forEach((snapshot) => {
        if (snapshot.root) {
            traverseNode(snapshot.root);
        }
    });

    return urls;
}

/**
 * Creates default MVS of `multiple` kind.
 *
 * @param metadata if provided, this object is used as global metadata
 * @returns default MVS
 */
export function createDefaultMVS(metadata?: GlobalMetadata) {
    const initialStateTree: MVSData = {
        kind: "multiple",
        metadata: metadata ?? {
            title: undefined,
            timestamp: new Date().toISOString(),
            version: `${MVSData.SupportedVersion}`,
        },
        snapshots: [] as Snapshot[],
    };
    return initialStateTree;
}

/**
 * Blank MVS.
 */
const BLANK_MVS: MVSData = {
    kind: "multiple",
    metadata: {
        title: undefined,
        timestamp: new Date().toISOString(),
        version: `${MVSData.SupportedVersion}`,
    },
    snapshots: [] as Snapshot[],
};

/**
 * Blank MVS as string;
 */
const BLANK_MVS_AS_STRING = JSON.stringify(BLANK_MVS, null, 2);

/**
 * Creates blank MVS of `multiple` kind.
 *
 * @returns blank MVS as string
 */
export function createBlankMVSDataAsString() {
    return BLANK_MVS_AS_STRING;
}

/**
 * Internally loads given `.mvsx` archive file using given instance of `RuntimeContext`.
 * @param runtimeCtx `RuntimeContext` instance
 * @param data data of `.mvsx` in the form of bytes
 * @param indexFilePath name of the index file
 * @returns loaded MVS, source URL (`arcp` path to `indexFilePath`), array of views, and map of assets if success, otherwise Error
 */
async function _loadMVSXFile(
    runtimeCtx: RuntimeContext,
    data: Uint8Array<ArrayBuffer>,
    indexFilePath: string = "index.mvsj",
): Promise<Result<LoadMVSXFileResult>> {
    const molstar = getMolstar();

    // Unzip archive.
    let files: { [path: string]: Uint8Array<ArrayBuffer> };
    try {
        files = (await unzip(runtimeCtx, data.buffer)) as typeof files;
    } catch (error) {
        return {
            success: false,
            error: new Error(`Invalid .mvsx archive: "${error}"!`),
        };
    }

    // Generate session archive ID.
    const archiveId = generateArchiveID();

    // Get .mvsj file.
    const indexFile = files[indexFilePath];
    if (!indexFile) {
        return {
            success: false,
            error: new Error(
                `File "${indexFilePath}" was not found in the .mvsx archive!`,
            ),
        };
    }

    // Decode .mvsj.
    let mvsData: MVSData;
    try {
        mvsData = MVSData.fromMVSJ(decodeUtf8(indexFile));
    } catch (error) {
        return {
            success: false,
            error: new Error(`Validation of .mvsj failed: "${error}"!`),
        };
    }

    // Retrieve all URLs from MVS.
    const urls = extractUrlsFromMVS(mvsData);

    // Iterate through local files in archive.
    const assets: ManagedAsset[] = [];
    for (const path in files) {
        // Ignore index file.
        if (path === indexFilePath) {
            continue;
        }

        // Ignore "empty filepaths", meaning that path could happen to be "path/", resulting in empty filepath.
        if (!path.split("/").pop()?.trim()) {
            continue;
        }

        // We check if the path is referenced somewhere in index file, if not, we still register it.
        let usedInAnyView = true;
        if (!urls.has(path)) {
            usedInAnyView = false;
        }

        urls.delete(path);

        const url = arcpUri(archiveId, path);
        const asset = ensureUrlAsset(url, files[path], {
            isFile: true,
        }); // TODO: use my own addLocalAssetIntoMolstar?

        const getAssetTypeBasedOnRelativePath = (path: string): ManagedAssetType => {
            const normalizedPath = path.toLowerCase();

            if (normalizedPath.startsWith("volumes/")) {
                return "Volume";
            }

            if (normalizedPath.startsWith("segmentations/")) {
                return "Segmentation";
            }

            if (normalizedPath.startsWith("structures/")) {
                return "Structure";
            }

            if (normalizedPath.startsWith("annotations/")) {
                return "Annotation";
            }

            return "Other";
        };

        assets.push({
            id: crypto.randomUUID(),
            asset: asset,
            type: getAssetTypeBasedOnRelativePath(path),
            relativePath: path, // E.g. "volumes/volume_0_0.bcif".
            tag: "local",
            name: path.split("/").pop() ?? path, // E.g. "volume_0_0.bcif".
            useCount: usedInAnyView ? 1 : 0,
            extension:
                getExtensionFromFileName(path.split("/").pop() ?? path) || "unknown",
            hidden: false,
            processingJobIds: [],
            children: [],
        });
    }

    // Push remaining (remote) assets.
    urls.forEach((remoteUrl) => {
        let extension = "unknown";
        const fromUrl = getExtensionFromUrl(remoteUrl);
        if (fromUrl && isExtensionSupported(fromUrl)) {
            extension = fromUrl;
        }
        assets.push({
            id: crypto.randomUUID(),
            asset: Asset.getUrlAsset(molstar!.managers.asset, remoteUrl),
            type: "Unknown",
            relativePath: remoteUrl,
            tag: "remote",
            name: remoteUrl,
            useCount: 1,
            extension: extension,
            hidden: false,
            processingJobIds: [],
            children: [],
        });
    });

    // Extract views.
    const views = extractViewsFromMVS(mvsData);

    return {
        success: true,
        value: {
            stateTree: mvsData,
            sourceUrl: arcpUri(archiveId, indexFilePath),
            views,
            assets,
        },
    };
}

/**
 * Loads given `MVSX` archive.
 * @param rawData data of `.mvsx` archive as bytes
 * @returns loaded MVS, source URL (`arcp` path to `indexFilePath`), array of views, and map of assets if success, otherwise Error
 */
export async function loadMVSXFile(
    rawData: Uint8Array<ArrayBuffer>,
): Promise<Result<LoadMVSXFileResult>> {
    const molstar = getMolstar();

    const taskResult: Result<LoadMVSXFileResult> = await molstar.runTask(
        Task.create("Load MVSX file", async (ctx) => {
            if (!molstar) throw new Error("Molstar is not initialized!");

            const parsed = await _loadMVSXFile(ctx, rawData);

            if (!parsed.success) {
                return { success: false, error: parsed.error };
            }

            // Load MVS into viewer.
            const result = await loadMVSIntoMolstar(
                parsed.value.stateTree,
                parsed.value.sourceUrl,
            );
            if (!result.success) {
                return {
                    success: false,
                    error: result.error,
                };
            }

            return {
                success: true,
                value: parsed.value,
            };
        }),
    );

    return taskResult;
}

/**
 * Loads MVSJ file.
 * @param rawData data of `.mvsj` file
 * @returns views and remote assets if success, else Error
 */
export async function loadMVSJFile(index: string): Promise<
    Result<{
        assets: ManagedAsset[];
        views: ViewMetadata[];
        stateTree: MVSData;
    }>
> {
    const molstar = getMolstar();

    try {
        // Parse MVSJ format to MVSData object.
        const mvsData: MVSData = MVSData.fromMVSJ(index);

        // Retrieve all remote URLs from MVS.
        const remoteUrls = extractUrlsFromMVS(mvsData);

        // Extract all remote assets and store them.
        const assets: ManagedAsset[] = [];
        remoteUrls.forEach((remoteUrl) => {
            let extension = "unknown";
            const fromUrl = getExtensionFromUrl(remoteUrl);
            if (fromUrl && isExtensionSupported(fromUrl)) {
                extension = fromUrl;
            }
            assets.push({
                id: crypto.randomUUID(),
                asset: Asset.getUrlAsset(molstar!.managers.asset, remoteUrl),
                type: "Unknown",
                relativePath: remoteUrl,
                tag: "remote",
                name: remoteUrl,
                useCount: 1,
                extension: extension,
                hidden: false,
                processingJobIds: [],
                children: [],
            });
        });

        // Load MVS into viewer.
        const result = await loadMVSIntoMolstar(mvsData);
        if (result.success) {
            return {
                success: true,
                value: {
                    assets,
                    views: extractViewsFromMVS(mvsData),
                    stateTree: mvsData,
                },
            };
        } else {
            return {
                success: false,
                error: result.error,
            };
        }
    } catch (error) {
        return {
            success: false,
            error: new Error(`Validation of .mvsj failed: "${error}"!`),
        };
    }
}

/**
 * Global variable holding the information if the Molstar viewer is in the (re)loading process.
 * Do not confuse with `molstarInitializing` variable from `useMolstarInit` hook.
 */
let _isMolstarReloading = false;

/**
 * Retrieves information if Molstar is (re)loading view, or applying given view index (essentially again reloading of a view).
 * Can be used for example to check if the subscription to some event is made by inner Molstar action or by calling our `reloadMolstarAndRestoreIndex` or `applySnapshotByIndex` functions.
 * @returns true if reloading otherwise false
 */
export function isMolstarReloading() {
    return _isMolstarReloading;
}

/**
 * Sets global `isMolstarReloading` variable. See `isMolstarReloading` for more information.
 * @param isReloading state
 */
export function setMolstarReloading(isReloading: boolean) {
    _isMolstarReloading = isReloading;
}

/**
 * Reloads Molstar with given `updated_tree` and restore index of view. Sets `isMolstarReloading` to `true`.
 * @param view view which is to be selected (you can reference it using either its index or key, where index has a priority); if undefined, we call function to get index from Molstar library itself
 * @param assets assets from `ManagedAssets` manager
 * @param updatedTree updated tree
 * @returns undefined or Error of any problem occurs
 */
export async function reloadMolstarAndRestoreIndex(
    view: { index?: number; key?: string } | undefined,
    assets: ManagedAsset[],
    updatedTree: MVSData_States,
) {
    setMolstarReloading(true);

    let currentIndex;
    if (!view) {
        currentIndex = getCurrentViewIndex();
    } else {
        if (view.index) {
            currentIndex = view.index;
        } else {
            // Find the index of the view we are currently editing.
            currentIndex = updatedTree.snapshots.findIndex(
                (snap: Snapshot) => snap.metadata.key === view.key,
            );
        }
    }

    // Build and load the tree.
    const renderTree = buildRenderTreeForMolstar(updatedTree, assets);
    const result = await loadMVSIntoMolstar(renderTree, undefined, currentIndex);

    setMolstarReloading(false);

    if (!result.success) {
        return result.error;
    }
}

/**
 * Loads MVS into Molstar and checks if the operation was successful. Does not set `isMolstarReloading`.
 * @param stateTree state tree to load
 * @param sourceUrl optional sourceUrl (`Base for resolving relative URLs/URIs. May itself be a relative URL (relative to the window URL)`)
 * @param currentIndex optional parameter which reloads given snapshot on the `currentIndex` index
 * @returns state tree or Error
 */
export async function loadMVSIntoMolstar(
    stateTree: MVSData,
    sourceUrl?: string,
    currentIndex?: number,
): Promise<Result<MVSData>> {
    const molstar = getMolstar();

    try {
        await loadMVS(molstar, stateTree, {
            appendSnapshots: false,
            keepCamera: false,
            sourceUrl: sourceUrl,
            keepCameraOrientation: false,
            extensions: [],
            sanityChecks: true,
            defaultSnapshotIndex: currentIndex,
        });

        const result = checkMolstarAfterLoading();
        if (!result.success) {
            return { success: false, error: result.error };
        }

        return { success: true, value: stateTree };
    } catch (err) {
        return {
            success: false,
            error: new Error(`Critical runtime error! Details: <${err}>.`),
        };
    }
}
