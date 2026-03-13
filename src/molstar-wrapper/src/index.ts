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
    type MVSData_State,
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
        let currentIndex = -1;

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
 * Clears the viewer.
 */
export async function clearViewer() {
    if (!molstar) throw new Error("Molstar is not initialized!");
    clearAllSnapshotsFromManager();
    clearMVSXFileAssets();
    await molstar.clear();
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
        if (entry.tag !== "mvsx-file") continue;
        if (!Asset.isUrl(entry.asset)) continue;

        const data = new Uint8Array(await entry.file.arrayBuffer());
        entries.push({
            asset: { kind: "url", id: entry.asset.id, url: entry.asset.url },
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
        molstar.managers.asset.set(entry.asset, file, { tag: "mvsx-file" });
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
    format: "mmcif" | "bcif";
    content: string | Uint8Array<ArrayBuffer>;
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
        if (downloadAsset.format === "mmcif") {
            builder
                .download({
                    url: downloadAsset.relativeUrl,
                })
                .parse({ format: "mmcif" })
                .volume()
                .representation({
                    type: "isosurface",
                    relative_isovalue: 1.0,
                    show_wireframe: false,
                    show_faces: true,
                });
        } else if (downloadAsset.format === "bcif") {
            builder
                .download({
                    url: downloadAsset.relativeUrl,
                })
                .parse({ format: "bcif" })
                .volume({ channel_id: "1" })
                .representation({
                    type: "isosurface",
                    relative_isovalue: 1.0,
                    show_wireframe: false,
                    show_faces: true,
                });
        }
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
            format: asset.extension === "cif" ? "mmcif" : "bcif",
            relativeUrl: relativeUrl,
            content: asset.content,
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
    assets: FileData[],
): Promise<MVSData | Uint8Array<ArrayBuffer>> {
    if (assets.length === 0) {
        return stateTree;
    }

    return await createArchive(
        stateTree,
        transformFileDataIntoDownloadAssets(assets),
    );
}

/**
 * Exports `stateTree` with possible local `assets` in the form of MVS.
 * Opens a file explorer for user to choose file location.
 * @param stateTree state tree to export
 * @param assets assets
 */
export async function exportStateTree(
    stateTree: MVSData,
    assets: FileData[],
): Promise<void> {
    // Prepare state tree (either MVSData if .mvsj, otherwise Uint8Array<ArrayBuffer>> for .mvsx).
    const data = await transfromStateTree(stateTree, assets);

    // Create data blob out of MVSStory.
    const blob = createMVSBlob(data);

    // Let user download the story.
    const filename = `${stateTree.metadata.title ? stateTree.metadata.title : "export"}.${data instanceof Uint8Array ? "mvsx" : "mvsj"}`;
    download(blob, filename);
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
    changes: {
        referenceCamera?: CameraState | undefined;
        thumbnail?: Base64Png;
        backgroundColor?: HexColor;
    },
): MVSTree {
    // Copy of original node.
    const nodeCopy = copyNode(node);

    // Only apply changes if we have reference camera data.
    if (changes.referenceCamera) {
        const { position, target, up } = changes.referenceCamera;

        // Find existing camera node.
        let cameraNode = nodeCopy.children?.find(
            (child) => child.kind === "camera",
        );

        // Update existing camera node.
        if (cameraNode) {
            cameraNode.params = {
                position: Array.from(position) as [number, number, number],
                target: Array.from(target) as [number, number, number],
                up: Array.from(up) as [number, number, number],
            };

            // Update or add thumbnail in custom.
            if (changes.thumbnail) {
                cameraNode.custom = {
                    ...(cameraNode.custom || {}),
                    thumbnail: changes.thumbnail,
                };
            }
        } else {
            // Create new camera node.
            const newCameraNode = {
                kind: "camera" as const,
                params: {
                    position: Array.from(position) as [number, number, number],
                    target: Array.from(target) as [number, number, number],
                    up: Array.from(up) as [number, number, number],
                },
                custom: changes.thumbnail
                    ? { thumbnail: changes.thumbnail }
                    : undefined,
            };

            // Add camera node as first child.
            if (!nodeCopy.children) {
                nodeCopy.children = [];
            }
            nodeCopy.children.unshift(newCameraNode);
        }
    }

    // Only apply changes if we have reference background color data.
    if (changes.backgroundColor) {
        // Find existing canvas node.
        let canvasNode = nodeCopy.children?.find(
            (child) => child.kind === "canvas",
        );

        // Update existing camera node.
        if (canvasNode) {
            canvasNode.params = {
                background_color: changes.backgroundColor as ColorT,
            };
        } else {
            // Create new canvas node.
            const newCanvasNode = {
                kind: "canvas" as const,
                params: {
                    background_color: changes.backgroundColor as ColorT,
                },
            };

            // Add canvas node to the end.
            if (!nodeCopy.children) {
                nodeCopy.children = [];
            }
            nodeCopy.children.push(newCanvasNode);
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
 */
export function addNewSnapshotToManager(
    key: string,
    title: string,
    description: string = "",
    descriptionFormat: "markdown" | "plaintext",
) {
    if (!molstar) throw new Error("Molstar is not initialized!");

    // Capture current plugin state.
    const currentState = molstar.state.getSnapshot();

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

/**
 * Update existing snapshot in the Molstar's snapshot manager.
 * @param index index of the snapshot to update
 * @param title nwe title
 * @param description new description
 * @param descriptionFormat new description format
 * @returns if there is error, result with `Error` is returned, otherise null
 */
export function updateSnapshotInManager(
    index: number,
    title: string,
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
    const snapshot = molstar.state.getSnapshot();
    molstar.managers.snapshot.replace(entry.snapshot.id, snapshot, {
        key: entry.key,
        name: title,
        description: description,
        descriptionFormat: descriptionFormat,
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

    const entry = entries.get(index) as any;
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

    return { success: true, value: null };
}

/**
 * Converts `multiple` kind to `single` kind by adding new `view`.
 * @param stateTree `single` state tree to convert
 * @param view view which will be added as the default one
 * @returns `multiple` state tree with one view (snapshot)
 */
export function convertStateTreeFromSingleToMultipleKind(
    stateTree: MVSData_State,
    view: View,
): MVSData_States {
    const snaphot: Snapshot = {
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
            id: crypto.randomUUID(),
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

// TODO: handle errors using result pattern
/**
 * Internally loads given `.mvsx` archive file using given instance of `RuntimeContext`.
 * @param runtimeCtx `RuntimeContext` instance
 * @param data data of `.mvsx` in the form of bytes
 * @param indexFilePath name of the index file
 * @returns loaded MVS, source URL (`arcp` path to `indexFilePath`), array of views, and map of assets
 */
async function _loadMVSXFile(
    runtimeCtx: RuntimeContext,
    data: Uint8Array<ArrayBuffer>,
    indexFilePath: string = "index.mvsj",
): Promise<{
    mvsData: MVSData;
    sourceUrl: string;
    views: ViewMetadata[];
    assets: Record<string, Uint8Array<ArrayBuffer>>;
}> {
    if (!molstar) throw new Error("Molstar is not initialized!");

    // Create an archive ID.
    const archiveId = `ni,MurmurHash3_128;${murmurHash3_128_fromBytes(
        data,
        42,
    )}${Date.now()}`;

    // Unzipping MVSX archive into dictionary.
    let files: { [path: string]: Uint8Array<ArrayBuffer> };
    try {
        files = (await unzip(runtimeCtx, data.buffer)) as typeof files;
    } catch (err) {
        console.log("Invalid MVSX file!");
        throw err;
    }

    // Register files into Molstar AsssetManager.
    for (const path in files) {
        const url = arcpUri(archiveId, path);
        ensureUrlAsset(molstar.managers.asset, url, files[path], {
            isFile: true,
        });
    }

    // Deconstruct files into assets files and the index file (.mvsj).
    const { [indexFilePath]: _, ...assets } = files;
    const indexFile = files[indexFilePath];
    if (!indexFile)
        throw new Error(`File ${indexFile} not found in the MVSX archive`);

    const mvsData = MVSData.fromMVSJ(decodeUtf8(indexFile));
    const sourceUrl = arcpUri(archiveId, indexFilePath);
    const views = extractViewsFromMVS(mvsData);

    return { mvsData, sourceUrl, views, assets };
}

/**
 * Creates default MVS of `multiple` kind.
 * @returns MVS
 */
function createDefaultMVSData() {
    const snapshots: Snapshot[] = [];
    const initialStateTree: MVSData = {
        kind: "multiple",
        metadata: {
            title: undefined,
            timestamp: new Date(0).toISOString(),
            version: `${MVSData.SupportedVersion}`,
        },
        snapshots,
    };
    return initialStateTree;
}

// TODO: handle errors using result pattern
/**
 * Loads given `MVSX` archive.
 * @param rawData data of `.mvsx` archive as bytes
 * @returns views and assets of the given MVSX file
 */
async function loadMVSXFile(rawData: Uint8Array<ArrayBuffer>) {
    if (!molstar) throw new Error("Molstar is not initialized!");

    let viewsToReturn: ViewMetadata[] = [];
    let assetsToReturn: Record<string, Uint8Array<ArrayBuffer>> = {};
    let stateTree: MVSData = createDefaultMVSData();
    let sourceUrl: string = "";

    await molstar.runTask(
        Task.create("Load MVSX file", async (ctx) => {
            const parsed = await _loadMVSXFile(ctx, rawData);
            viewsToReturn = parsed.views;
            assetsToReturn = parsed.assets;
            stateTree = parsed.mvsData;
            sourceUrl = parsed.sourceUrl;

            if (!molstar) throw new Error("Molstar is not initialized!");
            await loadMVS(molstar, parsed.mvsData, {
                sanityChecks: true,
                sourceUrl: parsed.sourceUrl,
                extensions: [],
                appendSnapshots: false,
                keepCamera: false,
                keepCameraOrientation: false,
            });
        }),
    );

    return {
        views: viewsToReturn,
        localAssets: assetsToReturn,
        stateTree: stateTree,
        sourceUrl: sourceUrl,
    };
}

// TODO: handle errors using result pattern
/**
 * Loads MVSJ file.
 * @param rawData data of `.mvsj` file.
 * @returns views
 */
async function loadMVSJFile(index: string) {
    if (!molstar) throw new Error("Molstar is not initialized!");

    const mvsData: MVSData = MVSData.fromMVSJ(index);
    if (!MVSData.isValid(mvsData)) {
        throw new Error(
            `Error when parsing MVSJ: ${MVSData.validationIssues(mvsData)}`,
        );
    }

    await loadMVS(molstar, mvsData, {
        appendSnapshots: false,
        keepCamera: false,
        keepCameraOrientation: false,
        extensions: [],
        sanityChecks: true,
    });

    return { views: extractViewsFromMVS(mvsData), stateTree: mvsData };
}

/**
 * Result of `loadFromFile` function.
 */
interface LoadFromFileResult {
    stateTree: MVSData;
    views: ViewMetadata[];
    localAssets: Record<string, Uint8Array<ArrayBuffer>>;
    sourceUrl: string;
}

/**
 * Loads data into viewer from the file.
 * @param fileData data to load
 * @returns views and possible assets from the loaded file, or null, if any problem occurs
 */
export async function loadFromFile(
    fileData: FileData | null,
): Promise<LoadFromFileResult | null> {
    // TODO: handle errors based on some result pattern so we can progate error message above
    if (!molstar) throw new Error("Molstar is not initialized!");

    if (!fileData) return null;

    await clearViewer();

    if (fileData.extension === "mvsj") {
        return {
            ...(await loadMVSJFile(fileData.content as string)),
            localAssets: {},
            sourceUrl: "",
        };
    }

    if (fileData.extension === "mvsx") {
        return await loadMVSXFile(fileData.content as Uint8Array<ArrayBuffer>);
    }

    if (fileData.extension === "bcif") {
        fileData.extension = "mmcif";
    }

    // TODO: solve how to handle other files, not to return null
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
        console.log(
            "Error occured when loading data from file: <",
            error,
            ">.",
        );
        return null;
    }

    return null;
}
