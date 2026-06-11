import { createPluginUI } from "molstar/lib/mol-plugin-ui";
import { renderReact18 } from "molstar/lib/mol-plugin-ui/react18";
import { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";
import { DefaultPluginUISpec } from "molstar/lib/mol-plugin-ui/spec";
import { Asset, AssetManager } from "molstar/lib/mol-util/assets";
import { PluginState } from "molstar/lib/mol-plugin/state";
import { Color } from "molstar/lib/mol-util/color";
import { Vec3 } from "molstar/lib/mol-math/linear-algebra/3d";
import {
    GlobalMetadata,
    MVSData,
    type MVSData_States,
    type SnapshotMetadata,
    type Snapshot,
} from "molstar/lib/extensions/mvs/mvs-data";
import { PluginCommands } from "molstar/lib/mol-plugin/commands";
import { loadMVS } from "molstar/lib/extensions/mvs/load";
import { PluginSpec } from "molstar/lib/mol-plugin/spec";
import { MolViewSpec } from "molstar/lib/extensions/mvs/behavior";
import { RuntimeContext, Task } from "molstar/lib/mol-task";
import { murmurHash3_128_fromBytes } from "molstar/lib/mol-data/util";
import { unzip, Zip } from "molstar/lib/mol-util/zip/zip";
import { useEffect, useState } from "react";
import { download } from "molstar/lib/mol-util/download";
import { ColorT } from "molstar/lib/extensions/mvs/tree/mvs/param-types";
import { type MVSTree } from "molstar/lib/extensions/mvs/tree/mvs/mvs-tree";
import { type Result } from "../../types/Result";
import { PluginStateSnapshotManager } from "molstar/lib/mol-plugin-state/manager/snapshots";
import { UUID } from "molstar/lib/mol-util";

// TODO: problem is this is defined on two places, here and in ManagedAssetsProvider
interface ManagedAsset {
    id: string;
    asset: Asset.Url;
    relativePath: string;
    tag: "local" | "remote";
    name: string;
    useCount: number;
}

/**
 * Instance of `PluginUIContext`.
 */
let molstar: PluginUIContext | undefined;

/**
 * Properties for `initMolstar` function.
 */
interface MolstarProps {
    showControls: boolean;
    isExpanded: boolean;
}

/**
 * Initializes `PluginUIContext` targeted into `container`, based on singleton principle.
 * @param container HTML element into which the plugin is mounted
 * @param props configuration properties
 * @param snapshot optional state snapshot to restore a previous session
 * @param assets optional assets to restore a previous session
 * @param snapshotManagerState optional state of snapshot manager to restore previous session
 * @returns initialized `PluginUIContext` instance
 */
export async function initMolstar(
    container: HTMLDivElement,
    props: MolstarProps,
    snapshot: PluginState.Snapshot | null,
    assets: SerializedAssets | null,
    snapshotManagerState: PluginStateSnapshotManager.StateSnapshot | null,
) {
    if (molstar) return molstar;

    molstar = await createPluginUI({
        target: container,
        render: renderReact18,
        spec: {
            ...DefaultPluginUISpec(),
            layout: {
                initial: {
                    regionState: {
                        bottom: "hidden",
                        left: "hidden",
                        right: "hidden",
                        top: "hidden",
                    },
                    showControls: props.showControls,
                    isExpanded: props.isExpanded,
                },
            },
            behaviors: [
                ...DefaultPluginUISpec().behaviors,
                PluginSpec.Behavior(MolViewSpec),
            ],
        },
    });

    if (assets && snapshotManagerState && snapshot) {
        await restoreSessionState(assets, snapshotManagerState, snapshot);
    }

    return molstar;
}

/**
 * Creates a subscription to the event: Molstar layout is expanded.
 * @param callback event to run
 * @warning Take care of the unsubscription.
 * @returns `Subscription` object
 */
export function getFullScreenSubscription(
    callback: (isExpanded: boolean) => void,
) {
    if (!molstar) throw new Error("Molstar is not initialized!");

    const sub = molstar.layout.events.updated.subscribe(() => {
        if (!molstar) return;

        const isFullscreen = molstar.layout.state.isExpanded;
        callback(isFullscreen);
    });

    return sub;
}

/**
 * Creates a subscription to the event: background color changes.
 * @param callback event to run
 * @warning Take care of the unsubscription.
 * @returns `Subscription` object
 */
export function getBackgroundColorChangeSubscription(
    callback: (color: Color | undefined) => void,
) {
    if (!molstar) throw new Error("Molstar is not initialized!");

    const sub = molstar.events.canvas3d.settingsUpdated.subscribe(() => {
        if (!molstar) return;
        const currentColor = molstar.canvas3d?.props.renderer.backgroundColor;
        callback(currentColor);
    });

    return sub;
}

/**
 * Creates a subscription to the event: current snapshot is changed by the user in Molstar UI.
 * @param callback event to run
 * @warning Take care of the unsubscription.
 * @returns `Subscription` object
 */
export function getSnapshotChangeSubscription(
    callback: (
        currentSnapshotIndex: number,
        entry: PluginStateSnapshotManager.Entry,
    ) => void,
) {
    if (!molstar) throw new Error("Molstar is not initialized!");

    const subscription = molstar.managers.snapshot.events.changed.subscribe(
        () => {
            if (!molstar) return;
            const current = molstar.managers.snapshot.state.current;

            if (current) {
                const entries = molstar.managers.snapshot.state.entries;
                let currentIndex = -1;

                for (let i = 0; i < entries.count(); i++) {
                    const entry = entries.get(i);
                    if (entry?.snapshot?.id === current) {
                        currentIndex = i;
                        callback(currentIndex, entry);
                        break;
                    }
                }
            }
        },
    );

    return subscription;
}

/**
 * Returns current snapshot index. Defaults to index 0.
 * @returns current snapshot index
 */
export function getCurrentSnapshotIndex(): number {
    if (!molstar) return 0;

    const current = molstar.managers.snapshot.state.current;
    if (current) {
        const entries = molstar.managers.snapshot.state.entries;
        for (let i = 0; i < entries.count(); i++) {
            const entry = entries.get(i);
            if (entry?.snapshot?.id === current) {
                return i;
            }
        }
    }

    return 0;
}

/**
 * Updates given region state.
 * @param region region to update
 * @param state region can be `hidden` or `full`
 */
export function updateRegionState(
    region: "bottom" | "left" | "right" | "top",
    state: "hidden" | "full",
) {
    if (!molstar) throw new Error("Molstar is not initialized!");

    molstar.layout.setProps({
        regionState: { ...molstar.layout.state.regionState, [region]: state },
    });
}

// --------------------------------------------------------------------------------------------- //

/**
 * Retrieves Molstar snapshot.
 * @returns Molstar snaphot
 */
export function getSnapshot(): PluginState.Snapshot {
    if (!molstar) throw new Error("Molstar is not initialized!");
    return molstar.state.getSnapshot();
}

/**
 * Retrieves snapshot manager state.
 * @returns Molstar snapshot manager state.
 */
export function getSnapshotManagerState(): Promise<PluginStateSnapshotManager.StateSnapshot> {
    if (!molstar) throw new Error("Molstar is not initialized!");
    return molstar.managers.snapshot.getStateSnapshot();
}

/**
 * Disposes current `PluginUIContext` instance.
 */
export function disposeMolstar() {
    if (!molstar) throw new Error("Molstar is not initialized!");
    clearMVSXFileAssets();
    molstar.dispose();
    molstar = undefined;
}

/**
 * Clears the viewer, clears the snapshots and file assets.
 */
export async function clearViewer() {
    if (!molstar) throw new Error("Molstar is not initialized!");
    clearAllSnapshotsFromManager();
    clearMVSXFileAssets();
    await molstar.clear();
}

/**
 * Clears only the viewer content.
 */
export async function clearViewerContent() {
    if (!molstar) throw new Error("Molstar is not initialized!");
    await molstar.clear();
}

/**
 * Retrieves all file assets from Molstar repository.
 * @returns file assets from Molstar repository
 */
export function getAllFileAssetsFromMolstar() {
    if (!molstar) throw new Error("Molstar is not initialized!");
    return molstar.managers.asset.assets;
}

/**
 * Clears the MVSX file assests in Molstar's manager.
 */
function clearMVSXFileAssets() {
    if (!molstar) throw new Error("Molstar is not initialized!");
    molstar.managers.asset.clearTag("mvsx-file");
}

// --------------------------------------------------------------------------------------------- //

/**
 * Contains immediate camera state.
 */
export type CameraState = {
    mode: "perspective" | "orthographic";
    target: [number, number, number] | Vec3;
    position: [number, number, number] | Vec3;
    up: [number, number, number] | Vec3;
    fov: number;
};

/**
 * Retrieves current camera state.
 * @returns current camera state or undefined if camera is not available
 */
export function getCameraState(): CameraState | undefined {
    if (!molstar || !molstar.canvas3d?.camera) return undefined;

    const cameraSnapshot = molstar.canvas3d.camera.getSnapshot();
    return {
        mode: cameraSnapshot.mode,
        target: Vec3.clone(molstar.canvas3d.camera.target),
        position: Vec3.clone(molstar.canvas3d.camera.position),
        up: Vec3.clone(molstar.canvas3d.camera.up),
        fov: cameraSnapshot.fov,
    };
}

/**
 * Retrieves default camera state.
 * @returns default camera
 */
export function getDefaultCameraState(): CameraState {
    return {
        mode: "perspective",
        position: Vec3.create(0, 0, 100),
        up: Vec3.create(0, 1, 0),
        target: Vec3.create(0, 0, 0),
        fov: 0.7853981633974483,
    };
}

/**
 * Hook for current camera state.
 * @returns current camera state or undefined if camera is not available
 */
export function useLiveCameraState(): CameraState | undefined {
    const [liveCameraState, setLiveCameraState] = useState<
        CameraState | undefined
    >(undefined);

    useEffect(() => {
        let handle: number;

        const update = () => {
            const current = getCameraState();
            setLiveCameraState((prev) =>
                areCameraStatesEqual(prev, current) ? prev : current,
            );
            handle = requestAnimationFrame(update);
        };

        handle = requestAnimationFrame(update);
        return () => cancelAnimationFrame(handle);
    }, []);

    return liveCameraState;
}

/**
 * Compares two `CameraState` objects for their equality.
 * @param a first object
 * @param b second object
 * @param epsilon tolerance threshold for floating numbers comparison
 * @returns true if they are "close enough" equal, otherwise false
 */
export function areCameraStatesEqual(
    a: CameraState | undefined,
    b: CameraState | undefined,
    epsilon: number = 0.1,
): boolean {
    if (!a || !b) return a === b;
    if (!a.position || !b.position) return false;
    if (!a.target || !b.target) return false;
    if (!a.up || !b.up) return false;

    return (
        Vec3.distance(
            Vec3.create(a.position[0], a.position[1], a.position[2]),
            Vec3.create(b.position[0], b.position[1], b.position[2]),
        ) < epsilon &&
        Vec3.distance(
            Vec3.create(a.target[0], a.target[1], a.target[2]),
            Vec3.create(b.target[0], b.target[1], b.target[2]),
        ) < epsilon &&
        Vec3.distance(
            Vec3.create(a.up[0], a.up[1], a.up[2]),
            Vec3.create(b.up[0], b.up[1], b.up[2]),
        ) < epsilon
    );
}

/**
 * Sets the camera.
 * @param cameraState camera state to set the camera
 */
export function setCamera(cameraState: CameraState) {
    if (!molstar) throw new Error("Molstar is not initialized!");

    const { mode, position, up, target, fov } = cameraState;

    molstar.canvas3d?.camera.setState({
        mode: mode,
        target: Vec3.create(target[0], target[1], target[2]),
        position: Vec3.create(position[0], position[1], position[2]),
        up: Vec3.create(up[0], up[1], up[2]),
        fov: fov,
    });
}

// --------------------------------------------------------------------------------------------- //

/**
 * Base64 PNG type.
 */
export type Base64Png = string;

/**
 * Retrieves canvas image in the form of Base64 PNG.
 * @returns screenshot as Base64 PNG, or undefined if it is not possible to retrieve a screenshot
 */
export async function getCanvasScreenshot(): Promise<Base64Png | undefined> {
    if (!molstar) throw new Error("Molstar is not initialized!");
    return await molstar.helpers.viewportScreenshot?.getImageDataUri();
}

// --------------------------------------------------------------------------------------------- //

/**
 * Represents a single view. Includes all necessary data to it.
 * Camera is represented by so called `reference camera`, see https://molstar.org/mol-view-spec-docs/camera-settings/.
 */
export type ViewMetadata = {
    id: string;
    referenceCamera?: CameraState;
    thumbnail?: Base64Png;
    backgroundColor?: string;
} & SnapshotMetadata;

/**
 * Represents a complete view. It contains current MVSTree node and also its metadata.
 */
export type View = {
    node: MVSTree;
    metadata: ViewMetadata;
};

/**
 * Represents a story with views and local assets.
 * In case `views` contains an array, the object represents `multiple` kind of MVS, otherwise `single`.
 */
export type Story = {
    metadata: GlobalMetadata;
    views: ViewMetadata | ViewMetadata[];
    localAssets: DownloadAsset[];
};

/**
 * Convert a real Molstar camera position to an MVS reference-camera position.
 *
 * MVS camera positions are defined assuming a fixed reference FOV:
 *  - Perspective: 60°
 *  - Orthographic: ~53°
 *
 * This function removes the effect of the real camera FOV so that
 * the stored position is FOV-independent.
 *
 * @param position position
 * @param target target
 * @param fov field of view in radians
 * @param mode camera mode
 * @returns adjusted camera position
 */
export function toMVSPosition(camera: {
    position: Vec3;
    target: Vec3;
    fov: number;
    mode: "perspective" | "orthographic";
}): Vec3 {
    const delta = Vec3.sub(Vec3(), camera.position, camera.target);

    const scaleRealToRef =
        camera.mode === "orthographic"
            ? Math.tan(camera.fov / 2) / 0.5
            : Math.sin(camera.fov / 2) / 0.5;

    return Vec3.scaleAndAdd(Vec3(), camera.target, delta, scaleRealToRef);
}

/**
 * Convert an MVS reference-camera position to a real Mol* camera position
 * for the currently active camera FOV.
 *
 * @param mvsPosition position from MVS
 * @param mvsTarget target from MVS
 * @param fovRad current field of view in radians
 * @param mode current camera mode
 * @returns real Molstar camera position
 */
export function fromMVSPosition(
    mvsPosition: Vec3,
    mvsTarget: Vec3,
    fovRad: number,
    mode: "perspective" | "orthographic",
): Vec3 {
    const delta = Vec3.sub(Vec3(), mvsPosition, mvsTarget);

    const scaleRefToReal =
        mode === "orthographic"
            ? 0.5 / Math.tan(fovRad / 2)
            : 0.5 / Math.sin(fovRad / 2);

    return Vec3.scaleAndAdd(Vec3(), mvsTarget, delta, scaleRefToReal);
}

/**
 * Converts color of type `Color` to hexadecimal format.
 * @param color color
 * @returns hexadecimal representation of `color` as string, default value is `#ffffff`,
 */
function convertColorToHexString(color: Color | undefined): string {
    if (color === undefined) return "#ffffff";
    return Color.toHexString(color);
}

/**
 * Type definition for color in hexadecimal format.
 */
export type HexColor = string;

/**
 * Get background color.
 * @returns background color
 */
export function getBackgroundColor(): HexColor {
    return convertColorToHexString(
        getSnapshot().canvas3d?.props?.renderer.backgroundColor,
    );
}

/**
 * Sets background color.
 * @param color color to set
 */
export function setBackgroundColor(color: HexColor) {
    if (!molstar) throw new Error("Molstar is not initialized!");

    const snapshot = getSnapshot();
    if (snapshot.canvas3d?.props) {
        snapshot.canvas3d.props.renderer.backgroundColor = Color(
            Number.parseInt(color.slice(1), 16),
        );
    }
    molstar.state.setSnapshot({ ...snapshot });
}

/**
 * Serialized form of in-memory MVSX assets that can survive plugin disposal.
 */
export interface SerializedAssets {
    entries: Array<{
        asset: Asset;
        isStatic?: boolean;
        data: Uint8Array;
    }>;
}

/**
 * Extracts all "mvsx-file" tagged assets from the asset manager into
 * plain transferable data.
 * Call this before disposing the plugin.
 * @returns serialized assets
 */
export async function serializeMVSXAssets(): Promise<SerializedAssets> {
    if (!molstar) throw new Error("Molstar is not initialized!");

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
 * Re-registers previously serialized MVSX assets into the asset manager
 * of the new plugin instance.
 * Call this before `setSnapshot`.
 * @param serialized serialized assets as returned by `serializeMVSXAssets`
 */
function restoreMVSXAssets(serialized: SerializedAssets) {
    if (!molstar) throw new Error("Molstar is not initialized!");

    for (const entry of serialized.entries) {
        const file = new File([entry.data.buffer as ArrayBuffer], "raw-data");
        // Re-use the exact same asset id and url so the snapshot's arcp:// references resolve to these entries.
        molstar.managers.asset.set(entry.asset, file, {
            tag: "mvsx-file",
            isStatic: entry.isStatic,
        });
    }
}

/**
 * Restores the previously stored sessions.
 * @param serialized serialized assets as returned by `serializeMVSXAssets`
 * @param snapshotManagerState Molstar's snapshot manager state
 * @param snapshot Molstar's snapshot
 */
async function restoreSessionState(
    serialized: SerializedAssets,
    snapshotManagerState: PluginStateSnapshotManager.StateSnapshot,
    snapshot: PluginState.Snapshot,
) {
    if (!molstar) throw new Error("Molstar is not initialized!");

    restoreMVSXAssets(serialized);
    await molstar.managers.snapshot.setStateSnapshot(snapshotManagerState);
    await molstar.state.setSnapshot(snapshot);
}

/**
 * Download asset used in MVS.
 */
type DownloadAsset = {
    relativeUrl: string;
    content: Uint8Array<ArrayBuffer>;
};

/**
 * Builds MVS snapshot from a single view.
 * @param view view metada
 * @param urls assets urls
 * @returns snapshot
 */
async function buildMVSSnapshot(
    view: ViewMetadata,
    urls: DownloadAsset[],
): Promise<Snapshot> {
    // Create MVS builder and get current Molstar snapshot.
    const builder = MVSData.createBuilder();

    // Add current background color into MVS.
    if (view.backgroundColor) {
        builder.canvas({
            background_color: view.backgroundColor as ColorT | undefined,
        });
    }

    // Add download nodes with assets.
    for (let i = 0; i < urls.length; ++i) {
        const downloadAsset = urls[i];
        // TODO: this logic below might be needed to seperate, and made more general
        builder
            .download({
                url: downloadAsset.relativeUrl,
            })
            .parse({ format: "bcif" }) // TODO: or "mmcif"?
            .volume({ channel_id: "1" })
            .representation({
                type: "isosurface",
                relative_isovalue: 1.0,
                show_wireframe: false,
                show_faces: true,
            });
    }

    // Include camera and thumbnail.
    if (view.referenceCamera) {
        let cameraParams;
        if (view.thumbnail) {
            cameraParams = {
                position: view.referenceCamera.position as unknown as [
                    number,
                    number,
                    number,
                ],
                target: view.referenceCamera.target as unknown as [
                    number,
                    number,
                    number,
                ],
                up: view.referenceCamera.up as unknown as [
                    number,
                    number,
                    number,
                ],
                custom: {
                    thumbnail: view.thumbnail,
                },
            };
        } else {
            cameraParams = {
                position: view.referenceCamera.position as unknown as [
                    number,
                    number,
                    number,
                ],
                target: view.referenceCamera.target as unknown as [
                    number,
                    number,
                    number,
                ],
                up: view.referenceCamera.up as unknown as [
                    number,
                    number,
                    number,
                ],
            };
        }

        builder.camera(cameraParams);
    }

    // Build the snapshot.
    return builder.getSnapshot({
        title: view.title,
        description: view.description,
        description_format: view.description_format,
        key: view.key,
        linger_duration_ms: view.linger_duration_ms,
        transition_duration_ms: view.transition_duration_ms,
    });
}

/**
 * Transform `assets` to array of relative urls (it strips the absolute path and extract only the filename) linked with the format (currently supporting only `.cif` and `.bcif`) and content.
 * @param assets assets array (it can be already in relative url form, function is idempotent)
 * @returns array of assets urls, formats and content
 */
function transformFileDataIntoDownloadAssets(
    assets: FileData[],
    prefix?: string,
): DownloadAsset[] {
    // Ensure prefix ends with a slash if it exists and starts with dot and slash, but use forward slashes only.
    const cleanPrefix = prefix
        ? `./${prefix.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/$/, "")}/`
        : "./";

    return assets.map((asset) => {
        const filenameWithExtension = asset.name;
        const relativeUrl = `${cleanPrefix}${filenameWithExtension}`;
        return {
            relativeUrl: relativeUrl,
            content: fileContentToUint8Array(asset.content),
        };
    });
}

/**
 * Creates a MVS from `story`.
 * @param story story
 * @returns `.mvsj` instance if there are no direct assets linked, otherwise it creates an archive (.mvsx)
 */
async function buildMVS(story: Story): Promise<MVSData | Uint8Array> {
    // Decide if the MVS should be "multiple" or "single".
    let index: MVSData;
    if (Array.isArray(story.views)) {
        // Iterate through all views and build them into Snapshots.
        const snapshots: Snapshot[] = [];
        for (let index = 0; index < story.views.length; index++) {
            const snapshot = await buildMVSSnapshot(
                story.views[index],
                story.localAssets,
            );
            snapshot.root.children?.push();
            snapshots.push(snapshot);
        }

        // Create an index (future index.mvsj) of "multiple" kind.
        index = {
            kind: "multiple",
            metadata: story.metadata,
            snapshots,
        };
    } else {
        // Create an index (future index.mvsj) of "single" kind.
        const snapshot = await buildMVSSnapshot(story.views, story.localAssets);
        index = {
            kind: "single",
            metadata: story.metadata,
            root: snapshot.root,
        };
    }

    // No local assets present.
    if (story.localAssets.length === 0) {
        return index;
    }

    // Create archive (.mvsx).
    return createArchive(index, story.localAssets);
}

/**
 * Creates an archive from index and assets.
 * @param index index
 * @param assets assets array (already in relative form)
 * @returns binary archive
 */
async function createArchive(
    index: MVSData,
    assets: DownloadAsset[],
): Promise<Uint8Array<ArrayBuffer>> {
    const encoder = new TextEncoder();
    const files: Record<string, Uint8Array<ArrayBuffer>> = {
        "index.mvsj": encoder.encode(
            JSON.stringify(index),
        ) as Uint8Array<ArrayBuffer>,
    };

    for (const asset of assets) {
        const pathInZip = asset.relativeUrl.startsWith("./")
            ? asset.relativeUrl.slice(2)
            : asset.relativeUrl;
        files[pathInZip] = asset.content as Uint8Array<ArrayBuffer>;
    }

    const zip = await Zip(files).run();
    return new Uint8Array(zip) as Uint8Array<ArrayBuffer>;
}

/**
 * Transform `stateTree` into format ready to be converted into `Blob` and exported.
 * The final format depends on the fact, if there are any `assets`, in that case, an archive must be created.
 * @param stateTree state tree
 * @param assets local assets (they can be in relative/absolute form, it does not matter)
 * @returns
 */
async function transfromStateTree(
    stateTree: MVSData,
    assets: DownloadAsset[],
): Promise<MVSData | Uint8Array<ArrayBuffer>> {
    if (assets.length === 0) {
        return stateTree;
    }

    return await createArchive(stateTree, assets);
}

/**
 * Exports `stateTree` with possible local `assets` in the form of MVS.
 * Opens a file explorer for user to choose file location.
 * @param stateTree state tree to export
 * @param assets assets
 * @return Error if there is an internal error in Molstar asset cache, othewise it returns true
 */
export async function exportStateTree(
    stateTree: MVSData,
    localAssets: ManagedAsset[],
): Promise<Result<boolean>> {
    if (!molstar) throw new Error("Molstar is not initialized!");

    const internalCache = molstar.managers.asset.assets;
    const localFiles: DownloadAsset[] = [];

    // Find data (binary) for local assets (managed assets hold only virtual references to local assets which are actually stored inside Molstar' asset manager).
    for (const managedAsset of localAssets) {
        if (managedAsset.tag === "local") {
            const targetUrl = managedAsset.asset.url;
            let foundData: Uint8Array | undefined;
            for (const wrapper of internalCache.values()) {
                if (
                    wrapper.asset.kind == "url" &&
                    wrapper.asset.url === targetUrl &&
                    wrapper.isStatic
                ) {
                    foundData = new Uint8Array(
                        await wrapper.file.arrayBuffer(),
                    );
                    break;
                }
            }

            if (foundData) {
                localFiles.push({
                    relativeUrl: managedAsset.relativePath,
                    content: foundData as Uint8Array<ArrayBuffer>,
                });
            } else {
                return {
                    success: false,
                    error: new Error(
                        `Internal error: failed to find ${targetUrl} inside Molstar's cache! Please, consider reporting this bug.`,
                    ),
                };
            }
        }
    }

    // Prepare state tree (either MVSData if .mvsj, otherwise Uint8Array<ArrayBuffer>> for .mvsx).
    const data = await transfromStateTree(stateTree, localFiles);

    // Create data blob out of MVSStory.
    const blob = createMVSBlob(data);

    // Let the user to download the story.
    const filename = `${stateTree.metadata.title ? stateTree.metadata.title : "export"}.${data instanceof Uint8Array ? "mvsx" : "mvsj"}`;
    download(blob, filename); // TODO: can we create our own download function to verify if user clicked on Cancel before exporting?

    return { success: true, value: true };
}

/**
 * Creates a deep copy of `node`.
 * @param node node to copy
 * @returns copy of node
 */
function copyNode(node: MVSTree) {
    return structuredClone(node);
}

/**
 * Creates a deep copy of `node` and applies `changes` to the copy, which is then returned.
 * @param node node to copy and apply changes to
 * @param changes changes
 * @returns copy of original `node` with applied changes
 */
export function applyChangesToNode(
    node: MVSTree,
    referenceCamera?: CameraState | undefined,
    thumbnail?: Base64Png,
): MVSTree {
    const nodeCopy = copyNode(node);

    if (referenceCamera) {
        const { position, target, up } = referenceCamera;

        let cameraNode = nodeCopy.children?.find(
            (child) => child.kind === "camera",
        );

        if (cameraNode) {
            cameraNode.params = {
                position: Array.from(position) as [number, number, number],
                target: Array.from(target) as [number, number, number],
                up: Array.from(up) as [number, number, number],
            };

            if (thumbnail) {
                cameraNode.custom = {
                    ...(cameraNode.custom || {}),
                    thumbnail: thumbnail,
                };
            } else if (cameraNode.custom) {
                delete cameraNode.custom.thumbnail;

                if (Object.keys(cameraNode.custom).length === 0) {
                    delete cameraNode.custom;
                }
            }
        } else {
            const newCameraNode: any = {
                kind: "camera" as const,
                params: {
                    position: Array.from(position) as [number, number, number],
                    target: Array.from(target) as [number, number, number],
                    up: Array.from(up) as [number, number, number],
                },
            };

            if (thumbnail) {
                newCameraNode.custom = { thumbnail: thumbnail };
            }

            if (!nodeCopy.children) {
                nodeCopy.children = [];
            }
            nodeCopy.children.unshift(newCameraNode);
        }
    }

    return nodeCopy;
}

/**
 * Creates copy if the given snapshot in the state tree.
 * @param stateTree state tree
 * @param index index of the snapshot to copy, the copy will be pushed to the array as last elemenet
 * @returns if index is out of range, it returns original state tree and undefined instead of new copy, otherwise it returns updated state tree and the copy of snapshot itself
 */
export function createCopyOfSnapshot(stateTree: MVSData_States, index: number) {
    if (index >= stateTree.snapshots.length || index < 0) {
        return { updatedTree: stateTree, newSnapshot: undefined };
    }

    const copyRoot = copyNode(stateTree.snapshots[index].root);

    const newSnapshot: Snapshot = {
        root: copyRoot,
        animation: stateTree.snapshots[index].animation
            ? { ...stateTree.snapshots[index].animation }
            : undefined,
        metadata: {
            ...stateTree.snapshots[index].metadata,
            title: `Copy of ${stateTree.snapshots[index].metadata.title}`,
            key: crypto.randomUUID(),
        },
    };

    return {
        updatedTree: {
            ...stateTree,
            snapshots: [...stateTree.snapshots, newSnapshot],
        },
        newSnapshot: newSnapshot,
    };
}

/**
 * Removes a snapshot at the specified index from the MVS state tree.
 * Returns both the new React-safe state tree and the removed snapshot.
 */
export function removeSnapshotFromTree(
    stateTree: MVSData_States,
    index: number,
) {
    if (index < 0 || index >= stateTree.snapshots.length) {
        return {
            updatedTree: stateTree,
            removedSnapshot: undefined,
        };
    }

    const removedSnapshot = stateTree.snapshots[index];

    const updatedTree: MVSData_States = {
        ...stateTree,
        snapshots: stateTree.snapshots.filter((_, i) => i !== index),
    };

    return {
        updatedTree,
        removedSnapshot,
    };
}

export function applyBackgroundColorToNode(
    node: MVSTree,
    backgroundColor?: HexColor,
): MVSTree {
    const nodeCopy = copyNode(node);

    if (backgroundColor) {
        let canvasNode = nodeCopy.children?.find(
            (child) => child.kind === "canvas",
        );

        if (canvasNode) {
            canvasNode.params = {
                background_color: backgroundColor as ColorT,
            };
        } else {
            const newCanvasNode = {
                kind: "canvas" as const,
                params: {
                    background_color: backgroundColor as ColorT,
                },
            };

            if (!nodeCopy.children) {
                nodeCopy.children = [];
            }
            nodeCopy.children.push(newCanvasNode);
        }
    } else {
        if (nodeCopy.children) {
            nodeCopy.children = nodeCopy.children.filter(
                (child) => child.kind !== "canvas",
            );
        }
    }

    return nodeCopy;
}

/**
 * Clears all snapshots from the manager.
 */
export function clearAllSnapshotsFromManager() {
    if (!molstar) throw new Error("Molstar is not initialized!");
    molstar.managers.snapshot.clear();
}

/**
 * Adds new snapshot to the Molstar's snapshot manager.
 * @param key key of snapshot
 * @param title title of the snapshot
 * @param description description of the snapshot
 * @param descriptionFormat format of description of the snapshot
 * @param emptySnapshot decides if the snapshot to add should be empty
 */
export function addNewSnapshotToManager(
    key: string,
    title: string,
    description: string = "",
    descriptionFormat: "markdown" | "plaintext",
    emptySnapshot: boolean = false,
) {
    if (!molstar) throw new Error("Molstar is not initialized!");

    let currentState: PluginState.Snapshot;
    if (emptySnapshot) {
        currentState = {
            id: UUID.create22(),
        };
    } else {
        currentState = molstar.state.getSnapshot();
    }

    // Add to the snapshot manager.
    molstar.managers.snapshot.add({
        timestamp: Date.now(),
        snapshot: currentState,
        name: title,
        description: description,
        descriptionFormat: descriptionFormat,
        key: key,
    });
}

export function updateSnapshotBackgroundColorInManager(
    index: number,
    backgroundColor: HexColor | undefined,
): Result<null> {
    if (!molstar) throw new Error("Molstar is not initialized!");

    const entries = molstar.managers.snapshot.state.entries;
    const count = entries.count();

    if (index < 0 || index >= count) {
        return {
            success: false,
            error: new Error(
                `Index <${index}> is out of bounds in the entries list!`,
            ),
        };
    }

    const entry = entries.get(index);
    if (!entry) {
        return {
            success: false,
            error: new Error(`Given entry on index <${index}> was not found!`),
        };
    }

    if (
        entry.snapshot.canvas3d?.props?.renderer.backgroundColor &&
        backgroundColor
    ) {
        const cleanHex = backgroundColor.replace("#", "");
        const numericColor = parseInt(cleanHex, 16) as Color;
        entry.snapshot.canvas3d.props.renderer.backgroundColor = numericColor;
    }

    molstar.managers.snapshot.replace(entry.snapshot.id, entry.snapshot, entry);

    return { success: true, value: null };
}

export function removeSnapshotInManager(index: number): Result<null> {
    if (!molstar) throw new Error("Molstar is not initialized!");

    const entries = molstar.managers.snapshot.state.entries;
    const count = entries.count();

    if (index < 0 || index >= count) {
        return {
            success: false,
            error: new Error(
                `Index <${index}> is out of bounds in the entries list!`,
            ),
        };
    }

    const entry = entries.get(index);
    if (!entry) {
        return {
            success: false,
            error: new Error(`Given entry on index <${index}> was not found!`),
        };
    }

    molstar.managers.snapshot.remove(entry.snapshot.id);

    return { success: true, value: null };
}

export function updateLiveBackgroundColor(
    backgroundColor: HexColor | undefined,
): void {
    if (!molstar || !molstar.canvas3d) return;

    if (backgroundColor) {
        const cleanHex = backgroundColor.replace("#", "");
        const numericColor = parseInt(cleanHex, 16) as Color;

        molstar.canvas3d.setProps({
            renderer: { backgroundColor: numericColor },
        });
    } else {
        molstar.canvas3d.setProps({
            renderer: { backgroundColor: 0xffffff as Color },
        });
    }

    molstar.canvas3d.requestDraw();
}

/**
 * Update existing snapshot in the Molstar's snapshot manager.
 * @param index index of the snapshot to update
 * @param description new description
 * @param descriptionFormat new description format
 * @returns if there is error, result with `Error` is returned, otherise null
 */
export function updateSnapshotDescriptionInManager(
    index: number,
    description: string = "",
    descriptionFormat: "markdown" | "plaintext",
): Result<null> {
    if (!molstar) throw new Error("Molstar is not initialized!");

    const entries = molstar.managers.snapshot.state.entries;
    const count = entries.count();

    if (index < 0 || index >= count) {
        return {
            success: false,
            error: new Error(
                `Index <${index}> is out of bounds in the entries list!`,
            ),
        };
    }

    const entry = entries.get(index);
    if (!entry) {
        return {
            success: false,
            error: new Error(`Given entry on index <${index}> was not found!`),
        };
    }

    molstar.managers.snapshot.replace(entry.snapshot.id, entry.snapshot, {
        ...entry,
        description: description,
        descriptionFormat: descriptionFormat,
    });

    return { success: true, value: null };
}

export function updateSnapshotTitleInManager(
    index: number,
    title: string,
): Result<null> {
    if (!molstar) throw new Error("Molstar is not initialized!");

    const entries = molstar.managers.snapshot.state.entries;
    const count = entries.count();

    if (index < 0 || index >= count) {
        return {
            success: false,
            error: new Error(
                `Index <${index}> is out of bounds in the entries list!`,
            ),
        };
    }

    const entry = entries.get(index);
    if (!entry) {
        return {
            success: false,
            error: new Error(`Given entry on index <${index}> was not found!`),
        };
    }

    molstar.managers.snapshot.replace(entry.snapshot.id, entry.snapshot, {
        ...entry,
        name: title,
    });

    return { success: true, value: null };
}

export function updateSnapshotCameraInManager(index: number): Result<null> {
    if (!molstar) throw new Error("Molstar is not initialized!");

    const entries = molstar.managers.snapshot.state.entries;
    const count = entries.count();

    if (index < 0 || index >= count) {
        return {
            success: false,
            error: new Error(
                `Index <${index}> is out of bounds in the entries list!`,
            ),
        };
    }

    const entry = entries.get(index);
    if (!entry) {
        return {
            success: false,
            error: new Error(`Given entry on index <${index}> was not found!`),
        };
    }
    const snapshot = molstar.state.getSnapshot();
    molstar.managers.snapshot.replace(entry.snapshot.id, snapshot, {
        ...entry,
    });

    return { success: true, value: null };
}

/**
 * Tells Molstar's snapshot manager which snapshot it should render by its index.
 * @param index index of the snapshot
 * @returns if there is error, result with `Error` is returned, otherise null
 */
export async function applySnapshotByIndex(
    index: number,
): Promise<Result<null>> {
    if (!molstar) throw new Error("Molstar is not initialized!");

    const entries = molstar.managers.snapshot.state.entries;
    const count = entries.count();

    if (index < 0 || index >= count) {
        return {
            success: false,
            error: new Error(
                `Index <${index}> is out of bounds in the entries list!`,
            ),
        };
    }

    const entry = entries.get(index);
    if (!entry || !entry.snapshot) {
        return {
            success: false,
            error: new Error(`Given entry on index <${index}> was not found!`),
        };
    }

    const snapshotId = entry.snapshot.id;
    await PluginCommands.State.Snapshots.Apply(molstar, {
        id: snapshotId,
    });

    const result = checkMolstarAfterLoading();
    if (!result.success) {
        return {
            success: false,
            error: result.error,
        };
    }

    return { success: true, value: null };
}

/**
 * Converts `multiple` kind to `single` kind by adding new `view`.
 * @param stateTree `single` state tree to convert
 * @returns `multiple` state tree with one view (snapshot)
 */
export function convertStateTreeFromSingleToMultipleKind(
    stateTree: MVSData,
): MVSData_States {
    if (stateTree.kind === "multiple") {
        return stateTree;
    }

    const snaphot: Snapshot = {
        root: stateTree.root,
        metadata: {
            title: undefined,
            description: undefined,
            description_format: undefined,
            key: undefined,
            linger_duration_ms: 5000,
            transition_duration_ms: undefined,
        },
    };

    const multipleMVS: MVSData = {
        kind: "multiple",
        metadata: {
            title: stateTree.metadata.title,
            version:
                stateTree.metadata.version || `${MVSData.SupportedVersion}`,
            timestamp: stateTree.metadata.timestamp,
            description: stateTree.metadata.description,
            description_format: stateTree.metadata.description_format,
        },
        snapshots: [snaphot],
    };

    return multipleMVS;
}

/**
 * Checks all snapshots in the MVS tree. If any are missing a `key` in their metadata,
 * it creates a new immutable tree with stable UUIDs assigned to those snapshots.
 *
 * @param stateTree state tree to fix
 * @returns new fixed state tree
 */
export function ensureAllSnapshotsHaveKeys(
    stateTree: MVSData_States,
): MVSData_States {
    const needsFixing = stateTree.snapshots.some((snap) => !snap.metadata.key);
    if (!needsFixing) return stateTree;

    return {
        ...stateTree,
        snapshots: stateTree.snapshots.map((snap) => ({
            ...snap,
            metadata: {
                ...snap.metadata,
                key: snap.metadata.key || crypto.randomUUID(),
            },
        })),
    };
}

/**
 * Adds view into state tree of `multiple` kind.
 * @param stateTree state tree
 * @param view new view (snapshot)
 * @returns modified state tree
 */
export function addViewIntoStateTree(
    stateTree: MVSData_States,
    view: View,
): MVSData_States {
    const snapshot: Snapshot = {
        root: view.node,
        metadata: {
            title: view.metadata?.title,
            description: view.metadata?.description,
            description_format: view.metadata?.description_format,
            key: view.metadata?.key,
            linger_duration_ms: view.metadata?.linger_duration_ms || 5000,
            transition_duration_ms: view.metadata?.transition_duration_ms,
        },
    };

    return {
        ...stateTree,
        snapshots: [...stateTree.snapshots, snapshot],
    };
}

/**
 * Creates MVS blob out of `data`. Function explores if `data` is just string-like (aka .mvsj) object or binary archive (aka .mvsx).
 * @param data data
 * @returns blob
 */
export function createMVSBlob(
    data:
        | string
        | MVSData
        | Uint8Array<ArrayBuffer>
        | Uint8Array<ArrayBufferLike>,
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
 * Prepares data for default single MVS from assets given as `fileData` parameter.
 * @param assets assets with global paths
 * @param processedFilename optional parameter which sets the title property of final MVS to the name of processed file
 * @returns bundle containing array buffer as the content and string extension user should use when saving this bundle
 */
export async function createDefaultMVSFromLocalFiles(
    assets: FileData[],
    processedFilename?: string,
): Promise<{
    data: string | Uint8Array<ArrayBuffer>;
    extension: "mvsx" | "mvsj";
    isBinary: boolean;
}> {
    const story: Story = {
        localAssets: transformFileDataIntoDownloadAssets(assets),
        views: [
            {
                id: crypto.randomUUID(),
                key: undefined,
                title: undefined,
                description: undefined,
                description_format: undefined,
                referenceCamera: undefined,
                backgroundColor: undefined,
                linger_duration_ms: 5000,
                transition_duration_ms: undefined,
            },
        ],
        metadata: {
            title: processedFilename,
            description: undefined,
            description_format: undefined,
            timestamp: Date(),
            version: `${MVSData.SupportedVersion}`,
        },
    };

    const data = await buildMVS(story);
    const isBinary = data instanceof Uint8Array;

    return {
        data: isBinary
            ? (data as any as Uint8Array<ArrayBuffer>)
            : JSON.stringify(data, null, 2),
        extension: isBinary ? "mvsx" : "mvsj",
        isBinary: isBinary,
    };
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

        const cameraNode = root.children?.find(
            (node) => node.kind === "camera",
        );

        type CameraParams = {
            target: [number, number, number] | Vec3;
            position: [number, number, number] | Vec3;
            up: [number, number, number] | Vec3;
        };

        const cameraParams = cameraNode?.params as CameraParams | undefined;
        const currentState = getCameraState() || getDefaultCameraState();

        const canvasNode = root.children?.find(
            (node) => node.kind === "canvas",
        );

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
 * Removed download node from the state tree.
 * @param rootNode root node
 * @param assetIdToRemove managed asset id in download node which will be removed
 * @returns modified node
 */
export function removeAssetFromRoot(rootNode: any, assetIdToRemove: string) {
    return {
        ...rootNode,
        children: rootNode.children?.filter((child: any) => {
            if (
                child.kind === "download" &&
                child.params?.url === assetIdToRemove
            ) {
                return false;
            }
            return true;
        }),
    };
}

/**
 * Add new asset to the download node with default values.
 *
 * @param rootNode root node
 * @param assetIdToAdd managed asset id
 * @param extension extension of the file
 * @param extensionParserRecord recod of mapped extension and its parser type
 * @param params optional drafted parameters from the UI to use instead of defaults
 * @returns modified node
 */
export function addAssetToRoot(
    rootNode: any,
    assetIdToAdd: string,
    extension: string,
    extensionParserRecord: Record<string, string>,
    params: {
        type: string;
        relative_isovalue: number;
        show_wireframe: boolean;
        show_faces: boolean;
        color: string;
    },
) {
    // Default format (parser) is "bcif". If it does not match to data, Molstar will throw an error when reloading this view anyway.
    const format: string = extensionParserRecord[extension] ?? "bcif";

    // Use provided params from the UI, or fallback to the standard Mol* defaults
    const type = params.type;
    const relative_isovalue = params.relative_isovalue;
    const show_wireframe = params.show_wireframe;
    const show_faces = params.show_faces;
    const color = params.color;

    const newDownloadBranch = {
        kind: "download",
        params: { url: assetIdToAdd },
        children: [
            {
                kind: "parse",
                params: { format: format },
                children: [
                    {
                        kind: "volume",
                        params: { channel_id: "0" },
                        children: [
                            {
                                kind: "volume_representation",
                                params: {
                                    type: type,
                                    relative_isovalue: relative_isovalue,
                                    show_wireframe: show_wireframe,
                                    show_faces: show_faces,
                                },
                                children: [
                                    {
                                        kind: "color",
                                        params: { color: color },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    };

    return {
        ...rootNode,
        children: [...(rootNode.children || []), newDownloadBranch],
    };
}

/**
 * Retrieves all download urls from snapshot.
 * @param snapshot snapshot
 * @returns list of urls
 */
export function getAllDownloadUrlsFromSnapshot(snapshot: Snapshot): string[] {
    const urls: string[] = [];
    if (!snapshot || !snapshot.root || !snapshot.root.children) return urls;

    snapshot.root.children.forEach((child: any) => {
        if (child.kind === "download" && child.params?.url) {
            urls.push(child.params.url);
        }
    });
    return urls;
}

/**
 * Recursively updates a parameter inside a specific node kind, but only for the branch belonging to the target asset id.
 *
 * @param node node to update, start with root
 * @param targetAssetId node which is updated has to have this id as download url
 * @param targetNodeKind node type to update, e.g. "volume_representation" or "color"
 * @param paramKey parameter to update, e.g. "relative_isovalue"
 * @param paramValue value which will used to update
 * @param inTargetBranch recursive helper paramter
 * @returns updated node
 */
export function updateNodeParamInAssetBranch(
    node: any,
    targetAssetId: string,
    targetNodeKind: string,
    paramKey: string,
    paramValue: any,
    inTargetBranch: boolean = false,
): any {
    let isCurrentlyInTargetBranch = inTargetBranch;
    if (node.kind === "download" && node.params?.url === targetAssetId) {
        isCurrentlyInTargetBranch = true;
    }

    let newParams = node.params;

    if (isCurrentlyInTargetBranch && node.kind === targetNodeKind) {
        newParams = {
            ...newParams,
            [paramKey]: paramValue,
        };
    }

    let newChildren = node.children;
    if (Array.isArray(node.children) && node.children.length > 0) {
        newChildren = node.children.map((child: any) =>
            updateNodeParamInAssetBranch(
                child,
                targetAssetId,
                targetNodeKind,
                paramKey,
                paramValue,
                isCurrentlyInTargetBranch,
            ),
        );
    }

    return {
        ...node,
        params: newParams,
        children: newChildren,
    };
}

/**
 * Retrieves current parameters of sepcific download node branch.
 *
 * @param rootNode root node
 * @param assetId asset id, see ManagedAsset
 * @returns extracted information
 */
export function getVolumeParamsForAsset(
    rootNode: any,
    assetId: string,
    defaultValues: {
        format: string;
        type: string;
        relative_isovalue: number;
        show_wireframe: boolean;
        show_faces: boolean;
        color: string;
    },
) {
    // Some default values.
    const params = { ...defaultValues };

    function traverse(node: any, inBranch: boolean) {
        let currentInBranch = inBranch;

        if (node.kind === "download" && node.params?.url === assetId) {
            currentInBranch = true;
        }

        if (currentInBranch) {
            if (node.kind === "parse" && node.params?.format !== undefined) {
                params.format = node.params.format;
            }

            if (node.kind === "volume_representation" && node.params) {
                if (node.params.type !== undefined)
                    params.type = node.params.type;
                if (node.params.relative_isovalue !== undefined)
                    params.relative_isovalue = node.params.relative_isovalue;
                if (node.params.show_wireframe !== undefined)
                    params.show_wireframe = node.params.show_wireframe;
                if (node.params.show_faces !== undefined)
                    params.show_faces = node.params.show_faces;
            }
            if (node.kind === "color" && node.params?.color) {
                params.color = node.params.color;
            }
        }

        if (Array.isArray(node.children)) {
            for (const child of node.children) {
                traverse(child, currentInBranch);
            }
        }
    }

    traverse(rootNode, false);
    return params;
}

/**
 * Replace asset IDs in node with arcp protocol url value.
 * @param node node
 * @param assets list of assets
 * @returns modified node
 */
function replaceNodeIdsWithMolstarUrls(node: any, assets: ManagedAsset[]): any {
    let newParams = node.params;

    if (newParams && typeof newParams.url === "string") {
        const currentId = newParams.url;
        const matchedAsset = assets.find((a) => a.id === currentId);

        if (matchedAsset) {
            const internalUrl =
                typeof matchedAsset.asset === "string"
                    ? matchedAsset.asset
                    : matchedAsset.asset.url;

            newParams = {
                ...newParams,
                url: internalUrl,
            };
        }
    }

    let newChildren = node.children;
    if (Array.isArray(node.children) && node.children.length > 0) {
        newChildren = node.children.map((child: any) =>
            replaceNodeIdsWithMolstarUrls(child, assets),
        );
    }

    return {
        ...node,
        params: newParams,
        children: newChildren,
    };
}

/**
 * Builds state tree with urls in arcp format.
 * @param stateTree state tree (urls are IDs of managed assets)
 * @param assets assets
 * @returns modified state tree
 */
export function buildRenderTreeForMolstar(
    stateTree: MVSData_States,
    assets: ManagedAsset[],
): MVSData_States {
    if (!assets || assets.length === 0) return stateTree;

    return {
        ...stateTree,
        snapshots: stateTree.snapshots.map((snapshot) => ({
            ...snapshot,
            root: replaceNodeIdsWithMolstarUrls(snapshot.root, assets),
        })),
    };
}

export function extractUrlsFromMVS(mvsData: MVSData): Set<string> {
    let snapshots: any[] = [];

    if (mvsData.kind !== "multiple") {
        snapshots.push({ root: mvsData.root, metadata: mvsData.metadata });
    } else {
        snapshots = mvsData.snapshots;
    }

    const remoteUrls = new Set<string>();
    const normalizePath = (path: string) =>
        path.startsWith("./") ? path.slice(2) : path;

    const traverseNode = (node: any) => {
        if (node.params) {
            if (typeof node.params.url === "string") {
                remoteUrls.add(normalizePath(node.params.url));
            }
            if (typeof node.params.uri === "string") {
                remoteUrls.add(normalizePath(node.params.uri));
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

    return remoteUrls;
}

/**
 * Traverses an MVS node and its children immutably.
 * Replaces any `url` parameters with the corresponding `ManagedAsset.id`.
 */
function replaceNodeUrlsWithIds(node: any, assets: ManagedAsset[]): any {
    let newParams = node.params;

    if (newParams && typeof newParams.url === "string") {
        const currentUrl = newParams.url;
        const normalizedCurrentUrl = currentUrl.startsWith("./")
            ? currentUrl.slice(2)
            : currentUrl;

        const matchedAsset = assets.find((a) => {
            const assetUrl =
                typeof a.asset === "string" ? a.asset : a.asset?.url;

            return (
                assetUrl === currentUrl ||
                a.relativePath === normalizedCurrentUrl
            );
        });
        if (matchedAsset) {
            newParams = {
                ...newParams,
                url: matchedAsset.id,
            };
        }
    } else if (newParams && typeof newParams.uri === "string") {
        const currentUri = newParams.uri;
        const normalizedCurrentUrl = currentUri.startsWith("./")
            ? currentUri.slice(2)
            : currentUri;

        const matchedAsset = assets.find((a) => {
            const assetUrl =
                typeof a.asset === "string" ? a.asset : a.asset?.url;

            return (
                assetUrl === currentUri ||
                a.relativePath === normalizedCurrentUrl
            );
        });

        if (matchedAsset) {
            newParams = {
                ...newParams,
                uri: matchedAsset.id,
            };
        }
    }

    let newChildren = node.children;
    if (Array.isArray(node.children) && node.children.length > 0) {
        newChildren = node.children.map((child: any) =>
            replaceNodeUrlsWithIds(child, assets),
        );
    }

    return {
        ...node,
        params: newParams,
        children: newChildren,
    };
}

/**
 * Replaces local/remote asset paths in the MVS tree with their internal ManagedAsset IDs.
 * Handles both `single` and `multiple` MVSData kinds safely.
 *
 * @param stateTree The current MVS source tree
 * @param assets Array of currently managed assets
 * @returns A new, immutable MVSData tree
 */
export function injectAssetIdsIntoTree(
    stateTree: MVSData_States,
    assets: ManagedAsset[],
): MVSData_States {
    if (!assets || assets.length === 0) {
        return stateTree;
    }

    return {
        ...stateTree,
        snapshots: stateTree.snapshots.map((snapshot) => ({
            ...snapshot,
            root: replaceNodeUrlsWithIds(snapshot.root, assets),
        })),
    };
}

/**
 * Traverses an MVS node and its children immutably.
 * Replaces any `url` or `uri` parameters matching an Asset ID back to its relative path.
 */
function replaceNodeIdsWithRelativePaths(
    node: any,
    assets: ManagedAsset[],
): any {
    let newParams = node.params;

    if (newParams) {
        if (typeof newParams.url === "string") {
            const currentId = newParams.url;
            const matchedAsset = assets.find((a) => a.id === currentId);

            if (matchedAsset) {
                let newPath = matchedAsset.relativePath;
                if (matchedAsset.tag === "local" && !newPath.startsWith("./")) {
                    newPath = `./${newPath}`;
                }
                newParams = {
                    ...newParams,
                    url: newPath,
                };
            }
        } else if (typeof newParams.uri === "string") {
            const currentId = newParams.uri;
            const matchedAsset = assets.find((a) => a.id === currentId);

            if (matchedAsset) {
                let newPath = matchedAsset.relativePath;
                if (matchedAsset.tag === "local" && !newPath.startsWith("./")) {
                    newPath = `./${newPath}`;
                }
                newParams = {
                    ...newParams,
                    uri: newPath,
                };
            }
        }
    }

    let newChildren = node.children;
    if (Array.isArray(node.children) && node.children.length > 0) {
        newChildren = node.children.map((child: any) =>
            replaceNodeIdsWithRelativePaths(child, assets),
        );
    }

    return {
        ...node,
        params: newParams,
        children: newChildren,
    };
}

export async function reloadMolstarAndRestoreIndex(
    viewKey: string,
    assets: ManagedAsset[],
    updatedTree: MVSData_States,
) {
    // Build and load the tree.
    const renderTree = buildRenderTreeForMolstar(updatedTree, assets);
    const result = await loadMVSIntoMolstar(renderTree);
    if (!result.success) {
        return result.error;
    }

    // Find the index of the view we are currently editing.
    const currentIndex = updatedTree.snapshots.findIndex(
        (snap) => snap.metadata.key === viewKey,
    );

    // Immediately force Molstar back to that index.
    if (currentIndex !== -1) {
        const result = await applySnapshotByIndex(currentIndex);
        if (!result.success) {
            return result.error;
        }
    }
}

/**
 * Replaces internal ManagedAsset IDs in the MVS tree back to their relative/remote paths.
 * Useful before exporting or saving the MVS file.
 *
 * @param stateTree The current MVS source tree (with IDs)
 * @param assets Array of currently managed assets
 * @returns A new, immutable MVSData tree (with paths)
 */
export function injectRelativePathsBasedOnAssetIdsIntoTree(
    stateTree: MVSData_States,
    assets: ManagedAsset[],
): MVSData_States {
    if (!assets || assets.length === 0) {
        return stateTree;
    }

    return {
        ...stateTree,
        snapshots: stateTree.snapshots.map((snapshot) => ({
            ...snapshot,
            root: replaceNodeIdsWithRelativePaths(snapshot.root, assets),
        })),
    };
}

function fileContentToUint8Array(
    content: string | Uint8Array<ArrayBuffer>,
): Uint8Array<ArrayBuffer> {
    if (typeof content === "string") {
        return new TextEncoder().encode(content) as Uint8Array<ArrayBuffer>;
    }
    return content;
}

// session archive ID — generated once, stored somewhere stable
let sessionArchiveId: string | null = null;

export function generateArchiveID(): string {
    if (!sessionArchiveId) {
        sessionArchiveId = `ni,MurmurHash3_128;${murmurHash3_128_fromBytes(
            new TextEncoder().encode(`session-${Date.now()}`),
            42,
        )}${Date.now()}`;
    }
    return sessionArchiveId;
}

export function resetSessionArchiveId() {
    sessionArchiveId = null;
}

/**
 * Add new local asset into Molstar asset manager.
 * @param file file
 * @param relativePath e.g. "volumes/seg/"
 * @returns `undefined` if there is already asset present
 */
export function addLocalAssetIntoMolstar(file: FileData, relativePath: string) {
    if (!molstar) throw new Error("Molstar is not initialized!");

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

export function addRemoteAssetIntoMolstar(url: string) {
    if (!molstar) throw new Error("Molstar is not initialized!");

    const asset = Asset.Url(url);
    molstar.managers.asset.set(asset, new File([], url), {
        isStatic: false,
        tag: undefined,
    });

    return { asset };
}

export function removeAssetFromMolstar(asset: Asset) {
    if (!molstar) throw new Error("Molstar is not initialized!");

    const entry = molstar.managers.asset.get(asset);
    if (!entry) return;

    molstar.managers.asset.delete(entry.asset);
}

export function replaceAssetRelativePathFromMolstar(
    asset: Asset.Url,
    newRelativeFilePath: string,
) {
    if (!molstar) throw new Error("Molstar is not initialized!");

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
 * Creates arcp URI.
 * @param archiveId id of the given archive
 * @param path path
 * @returns arcp URI
 */
function arcpUri(archiveId: string, path: string): string {
    return new URL(path, `arcp://${archiveId}/`).href;
}

/**
 * Ensures that a specific URL (typically an `arcp://` URI) is registered in the
 * Molstar AssetManager by pre-loading it with provided data.
 *
 * @param manager Molstar AssetManager instance responsible for data lifecycle
 * @param url unique identifier for the asset
 * @param data raw file data as a Uint8Array
 * @param options configuration for how the asset is stored
 */
function ensureUrlAsset(
    manager: AssetManager,
    url: string,
    data: Uint8Array<ArrayBuffer>,
    options?: { isFile?: boolean },
) {
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

/**
 * Instance of `TextDecoder`.
 */
let _decoder: TextDecoder | undefined;

/**
 * Decode `Uint8Array` into UTF8 string;
 * @param bytes bytes to decode
 * @returns UTF8 string
 */
function decodeUtf8(bytes: Uint8Array): string {
    _decoder ??= new TextDecoder();
    return _decoder.decode(bytes);
}

interface LoadMVSXFileResult {
    stateTree: MVSData;
    views: ViewMetadata[]; // TODO: probably remove this
    assets: ManagedAsset[];
    sourceUrl: string;
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
    if (!molstar) throw new Error("Molstar is not initialized!");

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
    const { [indexFilePath]: _ } = files;
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
    let mvsData: MVSData = createDefaultMVSData();
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
        // If it is remote URL, skip it.
        if (!urls.has(path)) {
            continue;
        }

        urls.delete(path);

        const url = arcpUri(archiveId, path);
        const asset = ensureUrlAsset(molstar.managers.asset, url, files[path], {
            isFile: true,
        }); // TODO: use my own addLocalAssetIntoMolstar?

        if (path === indexFilePath) continue;

        assets.push({
            id: crypto.randomUUID(),
            asset: asset,
            relativePath: path, // E.g. "volumes/volume_0_0.bcif".
            tag: "local",
            name: path.split("/").pop() ?? path, // E.g. "volume_0_0.bcif".
            useCount: 1,
        });
    }

    // Push remaining (remote) assets.
    urls.forEach((remoteUrl) => {
        assets.push({
            id: crypto.randomUUID(),
            asset: Asset.getUrlAsset(molstar!.managers.asset, remoteUrl),
            relativePath: remoteUrl,
            tag: "remote",
            name: remoteUrl,
            useCount: 1,
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
 * Adds an empty, default snapshot to an existing MVS state tree.
 * Safely converts `single` MVS data to `multiple` if needed.
 *
 * @param stateTree current MVSData tree
 * @param initialTitle title for snapshot
 * @returns new MVSData object with the appended snapshot
 */
export function addEmptySnapshotToTree(
    stateTree: MVSData,
    initialTitle: string,
): {
    newStateTree: MVSData_States;
    createdNode: Snapshot;
} {
    const emptyNode: Snapshot = {
        root: {
            kind: "root" as const,
            children: [],
        },
        metadata: {
            key: crypto.randomUUID(),
            title: initialTitle,
            linger_duration_ms: 5000,
            description_format: "markdown",
        },
    };

    if (stateTree.kind !== "multiple") {
        const data = createDefaultMVSData(stateTree.metadata);

        data.snapshots.push({
            root: stateTree.root,
            metadata: { linger_duration_ms: 5000 },
        });
        data.snapshots.push(emptyNode);

        return { newStateTree: data, createdNode: emptyNode };
    }

    return {
        newStateTree: {
            ...stateTree,
            snapshots: [...stateTree.snapshots, emptyNode],
        },
        createdNode: emptyNode,
    };
}

/**
 * Creates default MVS of `multiple` kind.
 *
 * @param metadata if provided, this object is used as global metadata
 * @returns default MVS
 */
function createDefaultMVSData(metadata?: GlobalMetadata) {
    const snapshots: Snapshot[] = [];
    const initialStateTree: MVSData = {
        kind: "multiple",
        metadata: metadata ?? {
            title: undefined,
            timestamp: new Date(0).toISOString(),
            version: `${MVSData.SupportedVersion}`,
        },
        snapshots,
    };
    return initialStateTree;
}

const BLANK_MVS: MVSData = {
    kind: "multiple",
    metadata: {
        title: undefined,
        timestamp: new Date().toISOString(),
        version: `${MVSData.SupportedVersion}`,
    },
    snapshots: [] as Snapshot[],
};

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
 * Loads given `MVSX` archive.
 * @param rawData data of `.mvsx` archive as bytes
 * @returns loaded MVS, source URL (`arcp` path to `indexFilePath`), array of views, and map of assets if success, otherwise Error
 */
async function loadMVSXFile(
    rawData: Uint8Array<ArrayBuffer>,
): Promise<Result<LoadMVSXFileResult>> {
    if (!molstar) throw new Error("Molstar is not initialized!");

    const taskResult = await molstar.runTask(
        Task.create("Load MVSX file", async (ctx) => {
            if (!molstar) throw new Error("Molstar is not initialized!");

            const parsed = await _loadMVSXFile(ctx, rawData);

            if (!parsed.success) {
                return parsed;
            }

            await loadMVS(molstar, parsed.value.stateTree, {
                sanityChecks: true,
                sourceUrl: parsed.value.sourceUrl,
                extensions: [],
                appendSnapshots: false,
                keepCamera: false,
                keepCameraOrientation: false,
            });

            return parsed;
        }),
    );

    return taskResult;
}

/**
 * Checks if Molstar contains any error after loading/reloading of data.
 * @returns result contains Error object, otherwise result contains only null if no error was found
 */
function checkMolstarAfterLoading(): Result<null> {
    if (!molstar) throw new Error("Molstar is not initialized!");

    const erroredCells = Array.from(molstar.state.data.cells.values()).filter(
        (cell) => cell.status === "error",
    );

    if (erroredCells.length > 0) {
        const errorDetails = erroredCells
            .map(
                (c) =>
                    `[${c.obj?.label || c.transform.transformer.id}]: ${c.errorText}`,
            )
            .join(", ");

        return {
            success: false,
            error: new Error(
                `Molstar failed to parse the data! Details: <${errorDetails}>.`,
            ),
        };
    }

    return {
        success: true,
        value: null,
    };
}

export async function loadMVSIntoMolstar(
    stateTree: MVSData_States,
): Promise<Result<MVSData_States>> {
    if (!molstar) throw new Error("Molstar is not initialized!");

    try {
        await loadMVS(molstar, stateTree, {
            appendSnapshots: false,
            keepCamera: true,
            keepCameraOrientation: true,
            extensions: [],
            sanityChecks: true,
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

/**
 * Loads MVSJ file.
 * @param rawData data of `.mvsj` file
 * @returns views and remote assets if success, else Error
 */
async function loadMVSJFile(index: string): Promise<
    Result<{
        assets: ManagedAsset[];
        views: ViewMetadata[];
        stateTree: MVSData;
    }>
> {
    if (!molstar) throw new Error("Molstar is not initialized!");

    try {
        // Parse MVSJ format to MVSData object.
        const mvsData: MVSData = MVSData.fromMVSJ(index);

        // Retrieve all remote URLs from MVS.
        const remoteUrls = extractUrlsFromMVS(mvsData);

        // Extract all remote assets and store them.
        const assets: ManagedAsset[] = [];
        remoteUrls.forEach((remoteUrl) => {
            assets.push({
                id: crypto.randomUUID(),
                asset: Asset.getUrlAsset(molstar!.managers.asset, remoteUrl),
                relativePath: remoteUrl,
                tag: "remote",
                name: remoteUrl,
                useCount: 1,
            });
        });

        // Load MVS into viewer.
        await loadMVS(molstar, mvsData, {
            appendSnapshots: false,
            keepCamera: false,
            keepCameraOrientation: false,
            extensions: [],
            sanityChecks: true,
        });

        return {
            success: true,
            value: {
                assets,
                views: extractViewsFromMVS(mvsData),
                stateTree: mvsData,
            },
        };
    } catch (error) {
        return {
            success: false,
            error: new Error(`Validation of .mvsj failed: "${error}"!`),
        };
    }
}

/**
 * Result of `loadFromFile` function.
 */
interface LoadFromFileResult {
    stateTree: MVSData_States;
    views: ViewMetadata[]; // TODO: probably remove this
    assets: ManagedAsset[];
    sourceUrl: string;
}

/**
 * Loads data into viewer from the file.
 * @param fileData data to load
 * @returns assets, views, state tree and source url if success, undefined if file is not MVSX or MVSJ; Error otherwise
 */
export async function loadFromFile(
    fileData: FileData,
): Promise<LoadFromFileResult | undefined | Error> {
    if (!molstar) throw new Error("Molstar is not initialized!");

    await clearViewer();

    if (fileData.extension === "mvsj") {
        const result = await loadMVSJFile(fileData.content as string);
        if (result.success) {
            return {
                stateTree: ensureAllSnapshotsHaveKeys(
                    convertStateTreeFromSingleToMultipleKind(
                        result.value.stateTree,
                    ),
                ),
                views: result.value.views,
                assets: result.value.assets,
                sourceUrl: "",
            };
        }
        return result.error;
    } else if (fileData.extension === "mvsx") {
        const result = await loadMVSXFile(
            fileData.content as Uint8Array<ArrayBuffer>,
        );
        if (result.success) {
            return {
                stateTree: ensureAllSnapshotsHaveKeys(
                    convertStateTreeFromSingleToMultipleKind(
                        result.value.stateTree,
                    ),
                ),
                views: result.value.views,
                assets: result.value.assets,
                sourceUrl: result.value.sourceUrl,
            };
        }
        return result.error;
    } else if (fileData.extension === "bcif") {
        fileData.extension = "mmcif";
    }

    const file = new File([fileData.content], fileData.name);
    const assetFile = Asset.File(file);

    try {
        const fileResult = await molstar.builders.data.readFile({
            file: assetFile,
            isBinary: fileData.binary,
        });

        const trajectory = await molstar.builders.structure.parseTrajectory(
            fileResult.data,
            fileData.extension as any,
        );

        await molstar.builders.structure.hierarchy.applyPreset(
            trajectory,
            "default",
        );
    } catch (error) {
        return new Error(
            `Error occured when loading data from file "${fileData.path}! Details: "${error}"."`,
        );
    }

    return undefined;
}
