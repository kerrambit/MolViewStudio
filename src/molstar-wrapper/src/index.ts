import { createPluginUI } from "molstar/lib/mol-plugin-ui";
import { renderReact18 } from "molstar/lib/mol-plugin-ui/react18";
import { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";
import { DefaultPluginUISpec } from "molstar/lib/mol-plugin-ui/spec";
import { Asset, AssetManager } from "molstar/lib/mol-util/assets";
import { PluginState } from "molstar/lib/mol-plugin/state";
import { Color } from "molstar/lib/mol-util/color";
import { Vec3 } from "molstar/lib/mol-math/linear-algebra/3d";
import {
    MVSData,
    MVSData_States,
    SnapshotMetadata,
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
import { MVSTree } from "molstar/lib/extensions/mvs/tree/mvs/mvs-tree";
import { Result } from "../../types/Result";

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
 * @returns initialized `PluginUIContext` instance
 */
export async function initMolstar(
    container: HTMLDivElement,
    props: MolstarProps,
    snapshot: PluginState.Snapshot | null,
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

    // molstar.behaviors.interaction.click.subscribe(
    //     ({ current, button /*, modifiers*/ }) => {
    //         if (!current.loci) return;

    //         if (button === ButtonsType.Flag.Secondary) {
    //         }

    //         if (StructureElement.Loci.is(current.loci)) {
    //             const location = StructureElement.Loci.getFirstLocation(
    //                 current.loci
    //             );
    //             if (location) {
    //                 const element = location.unit.model.atomicHierarchy.atoms;
    //                 const name = element.type_symbol.value(0);
    //                 console.log(`Clicked on element: ${name}.`);
    //             }
    //         }
    //     }
    // );

    // molstar.behaviors.interaction.hover.subscribe(({ current }) => {});

    if (snapshot) {
        molstar.state.setSnapshot(snapshot);
    }

    return molstar;
}

/**
 * Creates a subscription to the event: Molstar layout is expanded.
 * @param onChanged event to run
 * @warning Take care of the unsubscription.
 * @returns `Subscription` object
 */
export function getFullScreenSubscription(
    onChanged: (isExpanded: boolean) => void,
) {
    if (!molstar) throw new Error("Molstar is not initialized!");

    const sub = molstar.layout.events.updated.subscribe(() => {
        if (!molstar) return;

        const isFullscreen = molstar.layout.state.isExpanded;
        onChanged(isFullscreen);
    });

    return sub;
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
 * @returns
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
            setLiveCameraState(current);
            handle = requestAnimationFrame(update);
        };

        handle = requestAnimationFrame(update);
        return () => cancelAnimationFrame(handle);
    }, []);

    return liveCameraState;
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
} & SnapshotMetadata;

export type View = {
    node: MVSTree;
    metadata?: ViewMetadata;
};

/**
 * Represents a single local asset.
 */
export type LocalStoryAsset = {
    path: string;
    content: Uint8Array;
};

/**
 * Represents a story with views and local assets.
 */
// TODO: add GlobalMetadata to this
export type Story = {
    title: string | undefined;
    views: ViewMetadata[];
    assets: LocalStoryAsset[];
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
 * Download asset used in MVS.
 */
type DownloadAsset = {
    url: string;
    format: "mmcif" | "bcif";
};

/**
 * Converts color of type `Color` to hexadecimal format.
 * @param color color
 * @returns hexadecimal representation of `color` as string, default value is `#ffffff`,
 */
function convertColorToHexString(color: Color | undefined): string {
    if (color === undefined) return "#ffffff";
    return `#${color.toString(16).padStart(6, "0")}`;
}

/**
 * Builds MVS snapshot from a single view.
 * @param view view data
 * @param urls assets urls
 * @param thumbnail optional view thumbnail
 * @param includeCamera boolean flag if the camera state from `view` should be included into view
 * @returns built snapshot with `view` data
 */
async function buildMVSSnapshot(
    view: ViewMetadata,
    urls: DownloadAsset[],
    thumbnail: Base64Png | undefined,
    includeCamera: boolean,
): Promise<Snapshot> {
    // Create MVS builder and get current Molstar snapshot.
    const builder = MVSData.createBuilder();
    const molstarSnapshot = getSnapshot();

    // Add current background color into MVS.
    // TODO: background color has to be saved together with view
    builder.canvas({
        background_color: convertColorToHexString(
            molstarSnapshot.canvas3d?.props?.renderer.backgroundColor,
        ) as ColorT | undefined,
    });

    // Add download nodes with assets.
    for (let i = 0; i < urls.length; ++i) {
        // TODO: switching based on format should be reworked
        const downloadAsset = urls[i];
        if (downloadAsset.format === "mmcif") {
            builder
                .download({
                    url: downloadAsset.url,
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
                    url: downloadAsset.url,
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

    // Include camera.
    if (includeCamera && view.referenceCamera) {
        builder.camera({
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
            up: view.referenceCamera.up as unknown as [number, number, number],
            custom: {
                thumbnail: thumbnail,
            },
        });
    }

    // Build the snapshot.
    return builder.getSnapshot({
        title: view.title?.trim(),
        description: view.description,
        description_format: view.description_format,
        key: view.key?.trim(),
        linger_duration_ms: view.linger_duration_ms || 5000,
        transition_duration_ms: view.transition_duration_ms,
    });
}

/**
 * Transform `assets` to array of relative urls (it strips the absolute path and extract only the filename) linked with the format (currently supporting only `.cif` and `.bcif`).
 * @param assets assets array
 * @returns array of assets urls and their formats
 */
function transformLocalStoryAssetsIntoUrls(
    assets: LocalStoryAsset[],
): { format: "mmcif" | "bcif"; url: string }[] {
    return assets.map((asset) => {
        const fullPath = asset.path;
        const filenameWithExtension = fullPath.substring(
            fullPath.lastIndexOf("/") + 1,
        );
        const relativeUrl = `./${filenameWithExtension}`;
        const lastDotIndex = filenameWithExtension.lastIndexOf(".");

        let extension = "";
        if (lastDotIndex > 0) {
            extension = filenameWithExtension.substring(lastDotIndex);
        }
        return {
            format: extension === ".cif" ? "mmcif" : "bcif",
            url: relativeUrl,
        };
    });
}

/**
 * Creates a MVS from `story`.
 * @param story story
 * @param includeCameraInViews boolean flag if views inside `story` should include camera state
 * @returns `MVSData` instance if there are no direct assets linked, otherwise it creates an archive (.mvsx)
 */
async function buildMVSStory(
    story: Story,
    includeCameraInViews: boolean,
): Promise<MVSData | Uint8Array> {
    // Iterate through all views and build them into Snapshots.
    const snapshots: Snapshot[] = [];
    for (let index = 0; index < story.views.length; index++) {
        const view = story.views[index];
        const snapshot = await buildMVSSnapshot(
            view,
            transformLocalStoryAssetsIntoUrls(story.assets),
            view.thumbnail,
            includeCameraInViews,
        );
        snapshot.root.children?.push();
        snapshots.push(snapshot);
    }

    // Create an index (future index.mvsj).
    const index: MVSData = {
        kind: "multiple",
        metadata: {
            title: story.title,
            timestamp: new Date().toISOString(),
            version: `${MVSData.SupportedVersion}`,
        },
        snapshots,
    };

    if (!story.assets.length) {
        return index;
    }

    return createArchive(index, story.assets);
}

/**
 * Creates an archive from index and assets.
 * @param index index
 * @param assets assets array
 * @returns binary archive
 */
async function createArchive(
    index: MVSData,
    assets: LocalStoryAsset[],
): Promise<Uint8Array<ArrayBuffer>> {
    const encoder = new TextEncoder();
    const files: Record<string, Uint8Array<ArrayBuffer>> = {
        "index.mvsj": encoder.encode(
            JSON.stringify(index),
        ) as Uint8Array<ArrayBuffer>,
    };

    for (const asset of assets) {
        const pathInZip = asset.path.startsWith("./")
            ? asset.path.slice(2)
            : asset.path;
        files[pathInZip] = asset.content as Uint8Array<ArrayBuffer>;
    }

    const zip = await Zip(files).run();
    return new Uint8Array(zip) as Uint8Array<ArrayBuffer>;
}

/**
 * Transform `stateTree` into format ready to be converted into `Blob` and exported.
 * The final format depends on the fact, if there are any `assets`, in that case, an archive must be created.
 * @param stateTree
 * @param assets
 * @returns
 */
async function transfromStateTree(stateTree: MVSData, assets: FileData[]) {
    if (assets.length === 0) {
        return stateTree;
    }

    return await createArchive(
        stateTree,
        assets.map((fd) => ({
            path: fd.name,
            content: fd.content as Uint8Array<ArrayBuffer>,
        })),
    );
}

/**
 * Exports `stateTree` with possible lcoal assets` in the form of MVS.
 * Opens a file explorer for user to choose file location.
 * @param stateTree state tree to export
 * @param assets assets
 */
export async function exportStateTree(stateTree: MVSData, assets: FileData[]) {
    // Prepare state tree (either MVSData if .mvsj, otherwise Uint8Array<ArrayBuffer>> for .mvsx).
    const data = await transfromStateTree(stateTree, assets);

    // Create data blob out of MVSStory.
    const blob = createMVSBlob(data);

    // Let user download the story.
    const filename = `${stateTree.metadata.title ? stateTree.metadata.title : "export"}.${data instanceof Uint8Array ? "mvsx" : "mvsj"}`;
    download(blob, filename);
}

function convertSnapshotMetadataToViewMetadata(
    metadata: SnapshotMetadata,
): ViewMetadata {
    return {
        id: crypto.randomUUID(),
        key: metadata.key || crypto.randomUUID(),
        title: metadata.title || "New view...",
        description: metadata.description,
        description_format: metadata.description_format,
        referenceCamera: getDefaultCameraState(),
        linger_duration_ms: 5000,
        transition_duration_ms: metadata.transition_duration_ms,
    };
}

function copyView(view: View) {
    return structuredClone(view);
}

export function getPrimalViewCopy(stateTree: MVSData): View | null {
    if (stateTree.kind === "single" || !stateTree.kind) {
        const result = {
            node: stateTree.root,
        };
        return copyView(result);
    }

    const multipleState = stateTree as MVSData_States;
    if (multipleState.snapshots.length === 0) {
        return null;
    }

    const firstSnapshot = multipleState.snapshots[0];

    const result = {
        node: firstSnapshot.root,
        metadata: convertSnapshotMetadataToViewMetadata(firstSnapshot.metadata),
    };

    return copyView(result);
}

export function retrieveMVSSnapshotFromStateTreeByIndex(
    stateTree: MVSData,
    index: number,
): Result<Snapshot> {
    if (stateTree.kind !== "multiple") {
        return {
            success: false,
            error: new Error("Expected state tree of type <multiple>!"),
        };
    } else {
        if (index >= stateTree.snapshots.length)
            return {
                success: false,
                error: new Error(
                    `Index <${index}> is out of bounds in the current state tree!`,
                ),
            };

        return { success: true, value: stateTree.snapshots[index] };
    }
}

export async function addNewSnapshotToManager(
    key: string,
    title: string,
    description: string = "",
) {
    if (!molstar) throw new Error("Molstar is not initialized!");

    // Capture current plugin state.
    const currentState = molstar.state.getSnapshot();

    // Add to the snapshot manager.
    const entry = await molstar.managers.snapshot.add({
        name: title,
        description: description,
        key: key,
        snapshot: currentState,
        timestamp: 4564,
    });
}

export async function applySnapshotByIndex(index: number): Promise<void> {
    if (!molstar) throw new Error("Molstar is not initialized!");

    const entries = molstar.managers.snapshot.state.entries;
    const count = entries.count();

    if (index < 0 || index >= count) {
        throw new Error(`Invalid snapshot index: ${index}`);
    }

    const entry = entries.get(index) as any;
    if (!entry || !entry.snapshot) {
        throw new Error(`Could not get entry at index ${index}`);
    }

    const snapshotId = entry.snapshot.id;
    await PluginCommands.State.Snapshots.Apply(molstar, {
        id: snapshotId,
    });
}

// /**
//  * Converts signle state state tree into multiple state tree.
//  * It is also possible to use `MVSData.stateToStates()`, however out functions is tailored directly for our needs.
//  * @param stateTree state tree
//  * @param defaultViewMetadata metadata for the root default view
//  * @returns same state tree if it is already `multiple`, otherwise converted state tree
//  */
// export function convertStateTreeFromSingleToMultipleKind(
//     stateTree: MVSData,
//     defaultView: View,
// ): MVSData {
//     if (stateTree.kind === "multiple") {
//         return stateTree;
//     }

//     const metadata: SnapshotMetadata = {
//         key: defaultView?.key || crypto.randomUUID(),
//         title: defaultView?.title || "New view...",
//         description: defaultView?.description,
//         description_format: defaultView?.descriptionFormat,
//         linger_duration_ms: defaultView?.lingerDuration_ms || 5000,
//         transition_duration_ms: defaultView?.transitionDuration_ms || 500,
//     };

//     const view: Snapshot = {
//         root: stateTree.root,
//         metadata: metadata,
//     };

//     const multipleMVS: MVSData = {
//         kind: "multiple",
//         metadata: {
//             title: stateTree.metadata.title,
//             version:
//                 stateTree.metadata.version || `${MVSData.SupportedVersion}`,
//             timestamp: stateTree.metadata.timestamp,
//             description: stateTree.metadata.description,
//             description_format: stateTree.metadata.description_format,
//         },
//         snapshots: [view],
//     };

//     return multipleMVS;
// }

// TODO: handle errors better
// export function addViewIntoStateTree(
//     stateTree: MVSData_States,
//     view: View,
// ): MVSData | null {

//     const snapshotRoot = JSON.parse(JSON.stringify(stateTree.root));

//     // Add camera node.
//     try {
//         const cameraNode = {
//             kind: "camera",
//             params: {
//                 target: Array.from(view.referenceCamera.target) as [
//                     number,
//                     number,
//                     number,
//                 ],
//                 position: Array.from(view.referenceCamera.position) as [
//                     number,
//                     number,
//                     number,
//                 ],
//                 up: Array.from(view.referenceCamera.up) as [
//                     number,
//                     number,
//                     number,
//                 ],
//             },
//             custom: view?.thumbnail
//                 ? {
//                       thumbnail: view.thumbnail,
//                   }
//                 : undefined,
//         };

//         snapshotRoot.children = snapshotRoot.children || [];
//         snapshotRoot.children.unshift(cameraNode);
//     } catch (error) {
//         return null;
//     }

//     const metadata: SnapshotMetadata = {
//         key: view.key,
//         title: view.title,
//         description: view?.description,
//         description_format: view?.descriptionFormat,
//         linger_duration_ms: view?.lingerDuration_ms || 5000,
//         transition_duration_ms: view?.transitionDuration_ms || 500,
//     };

//     const snapshot: Snapshot = {
//         root: snapshotRoot,
//         metadata: metadata,
//     };

//     const multipleMVS: MVSData = {
//         kind: "multiple",
//         metadata: {
//             title: stateTree.metadata.title,
//             version:
//                 stateTree.metadata.version || `${MVSData.SupportedVersion}`,
//             timestamp: stateTree.metadata.timestamp,
//             description: stateTree.metadata.description,
//             description_format: stateTree.metadata.description_format,
//         },
//         snapshots: [snapshot],
//     };

//     return multipleMVS;
// }

/**
 * Exports views together with local assets in the form of MVS.
 * Opens a file explorer for user to choose file location.
 * @param views views
 * @param assets assets
 */
export async function exportViewsAsMVSStory(
    views: ViewMetadata[],
    assets: FileData[],
) {
    if (!molstar) throw new Error("Molstar is not initialized!");

    const storyTitle: string | undefined = undefined; // TODO: enable user to enter a story title

    // Create a story.
    const story: Story = {
        assets: assets.map((fd) => ({
            path: fd.name,
            content: fd.content as Uint8Array<ArrayBuffer>,
        })),
        views: views,
        title: storyTitle,
    };

    // Builds MVSStory.
    const data = await buildMVSStory(story, true);

    // Create data blob out of MVSStory.
    const blob = createMVSBlob(data);

    // Let user download the story.
    const filename = `${storyTitle ? storyTitle : "export"}.${data instanceof Uint8Array ? "mvsx" : "mvsj"}`;
    download(blob, filename);
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
 * Prepares data for default MVS from assets given as `fileData` parameter.
 * @param assets assets
 * @returns bundle containing array buffer as the content and string extension user should use when saving this bundle
 */
export async function prepareDataForDefaultMVS(assets: FileData[]): Promise<{
    data: string | Uint8Array<ArrayBuffer>;
    extension: "mvsx" | "mvsj";
    isBinary: boolean;
}> {
    if (!molstar) throw new Error("Molstar is not initialized!");

    const story: Story = {
        assets: assets.map((fd) => ({
            path: fd.name,
            content: fd.content as Uint8Array<ArrayBuffer>,
        })),
        views: [],
        title: undefined,
    };

    const id = crypto.randomUUID();
    story.views.push({
        id: id,
        key: id,
        title: "New view...",
        description: undefined,
        description_format: undefined,
        referenceCamera: getDefaultCameraState(),
        linger_duration_ms: 5000,
        transition_duration_ms: undefined,
    });

    const data = await buildMVSStory(story, false);
    const isBinary = data instanceof Uint8Array;

    return {
        data: isBinary
            ? (data as any as Uint8Array<ArrayBuffer>)
            : JSON.stringify(data, null, 2),
        extension: isBinary ? "mvsx" : "mvsj",
        isBinary: isBinary,
    };
}

// TODO: handle errors using result pattern
function extractViewsFromMVS(mvsData: MVSData): ViewMetadata[] {
    if (mvsData.kind !== "multiple") {
        return [];
    }

    const views: ViewMetadata[] = [];

    mvsData.snapshots.forEach((snapshot) => {
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
