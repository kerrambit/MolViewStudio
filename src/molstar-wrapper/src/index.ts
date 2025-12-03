import { createPluginUI } from "molstar/lib/mol-plugin-ui";
import { renderReact18 } from "molstar/lib/mol-plugin-ui/react18";
import { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";
import { DefaultPluginUISpec } from "molstar/lib/mol-plugin-ui/spec";
import { Asset, AssetManager } from "molstar/lib/mol-util/assets";
import { PluginState } from "molstar/lib/mol-plugin/state";
import { Color } from "molstar/lib/mol-util/color";
import { Vec3 } from "molstar/lib/mol-math/linear-algebra/3d";
import { MVSData, type Snapshot } from "molstar/lib/extensions/mvs/mvs-data";
import { loadMVS } from "molstar/lib/extensions/mvs/load";
import { PluginSpec } from "molstar/lib/mol-plugin/spec";
import { MolViewSpec } from "molstar/lib/extensions/mvs/behavior";
import { RuntimeContext, Task } from "molstar/lib/mol-task";
import { murmurHash3_128_fromBytes } from "molstar/lib/mol-data/util";
import { unzip, Zip } from "molstar/lib/mol-util/zip/zip";
import { useEffect, useState } from "react";
import { download } from "molstar/lib/mol-util/download";
import { Camera } from "molstar/lib/mol-canvas3d/camera";
import { type CameraView } from "../../ui/pages/viewer/Viewer";

interface MolstarProps {
    showControls: boolean;
    isExpanded: boolean;
    darkMode: boolean;
}

let molstar: PluginUIContext | undefined;

export async function initMolstar(
    container: HTMLDivElement,
    props: MolstarProps,
    snapshot: PluginState.Snapshot | null
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
            canvas3d: {
                renderer: {
                    backgroundColor: props.darkMode
                        ? Color.fromRgb(76, 72, 72)
                        : Color.fromRgb(255, 255, 255),
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

export function getSnapshot() {
    if (!molstar) throw new Error("Molstar is not initialized!");
    clearMVSXFileAssets();
    return molstar.state.getSnapshot();
}

export type Story = {
    scenes: SceneData[];
    assets: SceneAsset[];
};

export type SceneAsset = {
    name: string;
    content: Uint8Array;
};

export type CameraData = {
    mode: Camera.Mode;
    target: [number, number, number] | Vec3;
    position: [number, number, number] | Vec3;
    up: [number, number, number] | Vec3;
    fov: number;
};

export type SceneData = {
    id: string;
    header: string;
    key: string;
    description: string;
    camera?: CameraData | null;
    thumbnail?: Base64Png;
    linger_duration_ms?: number;
    transition_duration_ms?: number;
};

/**
 * MVS uses FOV-adjusted camera position. It is needed to apply inverse so it doesn't offset the view when loaded.
 * @param camera camera data
 * @returns adjusted camera position
 */
function adjustedCameraPosition(camera: CameraData): [number, number, number] {
    //
    const f =
        camera.mode === "orthographic"
            ? 1 / (2 * Math.tan(camera.fov / 2))
            : 1 / (2 * Math.sin(camera.fov / 2));

    const delta = Vec3.sub(
        Vec3(),
        camera.position as Vec3,
        camera.target as Vec3
    );

    return Vec3.scaleAndAdd(
        Vec3(),
        camera.target as Vec3,
        delta,
        1 / f
    ) as unknown as [number, number, number];
}

type DownloadAsset = {
    url: string;
    format: string;
};

async function getMVSSnapshot(
    scene: SceneData,
    urls: DownloadAsset[],
    thumbnail: Base64Png | undefined,
    includeCamera: boolean
) {
    const builder = MVSData.createBuilder();

    for (let i = 0; i < urls.length; ++i) {
        const downloadAsset = urls[i];
        // TODO: switching based on format is probably temporary here
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

    if (includeCamera && scene.camera) {
        builder.camera({
            position: adjustedCameraPosition(scene.camera),
            target: scene.camera.target as unknown as [number, number, number],
            up: scene.camera.up as unknown as [number, number, number],
            custom: {
                thumbnail: thumbnail,
            },
        });
    }

    return builder.getSnapshot({
        key: scene.key.trim(),
        title: scene.header.trim(),
        description: scene.description,
        linger_duration_ms: scene.linger_duration_ms || 5000,
        transition_duration_ms: scene.transition_duration_ms || 500,
    });
}

async function getMVSData(
    story: Story,
    includeCamera: boolean
): Promise<MVSData | Uint8Array> {
    const snapshots: Snapshot[] = [];
    for (let index = 0; index < story.scenes.length; index++) {
        const scene = story.scenes[index];
        const snapshot = await getMVSSnapshot(
            scene,
            story.assets.map((asset) => {
                // here we parse the filename and extension
                const fullPath = asset.name;
                const filenameWithExtension = fullPath.substring(
                    fullPath.lastIndexOf("/") + 1
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
            }),
            scene.thumbnail,
            includeCamera
        );
        snapshot.root.children?.push();
        snapshots.push(snapshot);
    }

    const index: MVSData = {
        kind: "multiple",
        metadata: {
            title: undefined,
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

async function createArchive(index: MVSData, assets: SceneAsset[]) {
    //
    const encoder = new TextEncoder();
    const files: Record<string, Uint8Array<ArrayBuffer>> = {
        "index.mvsj": encoder.encode(
            JSON.stringify(index)
        ) as Uint8Array<ArrayBuffer>,
    };

    for (const asset of assets) {
        const pathInZip = asset.name.startsWith("./")
            ? asset.name.slice(2)
            : asset.name;
        files[pathInZip] = asset.content as Uint8Array<ArrayBuffer>;
    }

    const zip = await Zip(files).run();
    return new Uint8Array(zip) as Uint8Array<ArrayBuffer>;
}

export async function downloadViewerState(
    fileData: FileData[] | null,
    views: CameraView[]
) {
    if (!molstar) throw new Error("Molstar is not initialized!");

    const story: Story = {
        assets: fileData
            ? fileData.map((f, index) => ({
                  name: f.name ?? `asset_${index}`,
                  content: f.content as Uint8Array<ArrayBuffer>,
              }))
            : [],
        scenes: [],
    };

    views.forEach((view) => {
        story.scenes.push({
            id: view.id,
            header: view.title,
            key: view.id,
            description: "Description...", // tmp
            thumbnail: view.thumbnail!,
            camera: {
                mode: molstar?.canvas3d?.camera.getSnapshot().mode!,
                target: view.target!,
                position: view.position!,
                up: view.up!,
                fov: molstar?.canvas3d?.camera.getSnapshot().fov!,
            },
        });
    });

    // console.log("ASSETS: ", molstar.managers.asset.assets.length);
    // molstar.managers.asset.assets.map(
    //     (a: {
    //         asset: Asset;
    //         file: File;
    //         refCount: number;
    //         isStatic?: boolean;
    //         tag?: string;
    //     }) => console.log(a)
    // );

    const data = await getMVSData(story, true);
    const blob =
        data instanceof Uint8Array
            ? new Blob([data as Uint8Array<ArrayBuffer>], {
                  type: "application/octet-stream",
              })
            : new Blob([JSON.stringify(data, null, 2)], {
                  type: "application/json",
              });

    const filename = `${"tmp"}.${data instanceof Uint8Array ? "mvsx" : "mvsj"}`;

    download(blob, filename);
}

export async function prepareDefaultMVSState(fileData: FileData[] | null) {
    if (!molstar) throw new Error("Molstar is not initialized!");

    const story: Story = {
        assets: fileData
            ? fileData.map((f, index) => ({
                  name: f.name ?? `asset_${index}`,
                  content: f.content as Uint8Array<ArrayBuffer>,
              }))
            : [],
        scenes: [],
    };

    story.scenes.push({
        id: "",
        header: "New view...",
        key: "",
        description: "",
    });

    const data = await getMVSData(story, false);
    const blob =
        data instanceof Uint8Array
            ? new Blob([data as Uint8Array<ArrayBuffer>], {
                  type: "application/octet-stream",
              })
            : new Blob([JSON.stringify(data, null, 2)], {
                  type: "application/json",
              });

    const filename = `${"tmp"}.${data instanceof Uint8Array ? "mvsx" : "mvsj"}`;

    download(blob, filename);
}

// ----------------------------------------------------------------------------------- //

export type CameraState = {
    position?: Vec3;
    up?: Vec3;
    target?: Vec3;
};

export function getCameraState(): CameraState {
    if (!molstar) throw new Error("Molstar is not initialized!");
    if (!molstar.canvas3d?.camera)
        throw new Error("Molstar camera is not accessible!");

    return {
        position: Vec3.clone(molstar.canvas3d?.camera.position),
        up: Vec3.clone(molstar.canvas3d?.camera.up),
        target: Vec3.clone(molstar.canvas3d?.camera.target),
    };
}

export function useLiveCameraState(): CameraState | undefined {
    const [liveCameraState, setLiveCameraState] = useState<
        CameraState | undefined
    >(undefined);

    useEffect(() => {
        const interval = setInterval(() => {
            try {
                setLiveCameraState(getCameraState());
            } catch {
                setLiveCameraState(undefined);
            }
        }, 100);

        return () => clearInterval(interval);
    }, []);

    return liveCameraState;
}

export function setCamera(cameraState: CameraState) {
    if (!molstar) throw new Error("Molstar is not initialized!");

    const { position, up, target } = cameraState;

    molstar.canvas3d?.camera.setState({
        position: position ?? molstar.canvas3d?.camera.position,
        up: up ?? molstar.canvas3d?.camera.up,
        target: target ?? molstar.canvas3d?.camera.target,
    });
}

export type Base64Png = string;

export async function getCanvasImageAsUri(): Promise<Base64Png | undefined> {
    if (!molstar) throw new Error("Molstar is not initialized!");

    const helper = molstar.helpers.viewportScreenshot;
    return await helper?.getImageDataUri();
}

export function disposeMolstar() {
    if (!molstar) throw new Error("Molstar is not initialized!");
    clearMVSXFileAssets();
    molstar?.dispose();
    molstar = undefined;
}

export async function clearViewer() {
    if (!molstar) throw new Error("Molstar is not initialized!");
    clearMVSXFileAssets();
    await molstar.clear();
}

// ------------------------------------------------------------------------------------

export async function loadDefaultPbdStructure() {
    if (!molstar) throw new Error("Molstar is not initialized!");

    await clearViewer();

    const data = await molstar.builders.data.download(
        { url: "https://files.rcsb.org/download/3PTB.pdb" },
        { state: { isGhost: true } }
    );

    const trajectory = await molstar.builders.structure.parseTrajectory(
        data,
        "pdb"
    );
    const preset = await molstar.builders.structure.hierarchy.applyPreset(
        trajectory,
        "default"
    );

    return preset;
}

function clearMVSXFileAssets() {
    if (!molstar) throw new Error("Molstar is not initialized!");
    molstar.managers.asset.clearTag("mvsx-file");
}

function arcpUri(archiveId: string, path: string): string {
    return new URL(path, `arcp://${archiveId}/`).href;
}

function ensureUrlAsset(
    manager: AssetManager,
    url: string,
    data: Uint8Array<ArrayBuffer>,
    options?: { isFile?: boolean }
) {
    const asset = Asset.getUrlAsset(manager, url);

    if (!manager.has(asset)) {
        const filename = url.split("/").pop() ?? "file";
        manager.set(
            asset,
            new File([data], filename),
            options?.isFile ? { isStatic: true, tag: "mvsx-file" } : undefined
        );
    }
}

let _decoder: TextDecoder | undefined;
function decodeUtf8(bytes: Uint8Array): string {
    _decoder ??= new TextDecoder();
    return _decoder.decode(bytes);
}

async function _loadMVSXFile(
    runtimeCtx: RuntimeContext,
    data: Uint8Array<ArrayBuffer>,
    mainFilePath: string = "index.mvsj"
): Promise<{ mvsData: MVSData; sourceUrl: string; views: CameraView[] }> {
    if (!molstar) throw new Error("Molstar is not initialized!");
    clearMVSXFileAssets();

    const archiveId = `ni,MurmurHash3_128;${murmurHash3_128_fromBytes(
        data,
        42
    )}${Date.now()}`;

    let files: { [path: string]: Uint8Array<ArrayBuffer> };
    try {
        files = (await unzip(runtimeCtx, data.buffer)) as typeof files;
    } catch (err) {
        console.log("Invalid MVSX file!");
        throw err;
    }

    for (const path in files) {
        const url = arcpUri(archiveId, path);
        ensureUrlAsset(molstar.managers.asset, url, files[path], {
            isFile: true,
        });
    }

    const mainFile = files[mainFilePath];
    if (!mainFile)
        throw new Error(`File ${mainFilePath} not found in the MVSX archive`);

    const mvsData = MVSData.fromMVSJ(decodeUtf8(mainFile));
    const sourceUrl = arcpUri(archiveId, mainFilePath);
    const views = extractViewsFromMVS(mvsData);

    return { mvsData, sourceUrl, views };
}

export async function loadDefaultMVSXFile() {
    if (!molstar) throw new Error("Molstar is not initialized!");

    const response = await fetch(
        "https://molstar.org/mol-view-spec-docs/files/1h9t.mvsx"
    );
    const arrayBuffer = await response.arrayBuffer();
    const rawData = new Uint8Array(arrayBuffer);

    loadMVSXFile(rawData);
}

async function loadMVSXFile(rawData: Uint8Array<ArrayBuffer>) {
    if (!molstar) throw new Error("Molstar is not initialized!");

    let viewsToReturn: CameraView[] = [];

    await molstar.runTask(
        Task.create("Load MVSX file", async (ctx) => {
            const parsed = await _loadMVSXFile(ctx, rawData);
            viewsToReturn = parsed.views;

            if (!molstar) throw new Error("Molstar is not initialized!");
            await loadMVS(molstar, parsed.mvsData, {
                sanityChecks: true,
                sourceUrl: parsed.sourceUrl,
            });
        })
    );

    return viewsToReturn;
}

export async function loadDefaultMVSJFile() {
    if (!molstar) throw new Error("Molstar is not initialized!");
    const response = await fetch(
        "https://raw.githubusercontent.com/molstar/molstar/master/examples/mvs/1cbs.mvsj"
    );
    const rawData = await response.text();

    loadMVSJFile(rawData);
}

// TODO: sort out the errors and warnings better here
function extractViewsFromMVS(mvsData: MVSData): CameraView[] {
    if (mvsData.kind !== "multiple") {
        return [];
    }

    const views: CameraView[] = [];

    mvsData.snapshots.forEach((snapshot) => {
        const { root, metadata } = snapshot;
        const cameraNode = root.children?.find(
            (node) => node.kind === "camera"
        );

        type CameraParams = CameraState & {
            mode?: string;
            fov?: number;
        };

        const cameraParams = cameraNode?.params as CameraParams | undefined;

        if (cameraParams && metadata.key) {
            const view: CameraView = {
                id: metadata.key,
                title: metadata.title || "Untitled View",
                position: cameraParams.position!,
                target: cameraParams.target!,
                thumbnail: cameraNode?.custom?.thumbnail,
                up: cameraParams.up!,
            };

            views.push(view);
        } else if (!metadata.key) {
            console.log(
                `Snapshot missing required 'key' metadata. Skipping snapshot with title: ${metadata.title}`
            );
        } else {
            console.log(
                `Snapshot with ID ${metadata.key} is missing a 'camera' node. Skipping.`
            );
        }
    });

    return views;
}

async function loadMVSJFile(rawData: string) {
    if (!molstar) throw new Error("Molstar is not initialized!");

    const mvsData: MVSData = MVSData.fromMVSJ(rawData);
    if (!MVSData.isValid(mvsData)) {
        throw new Error(`Oh no: ${MVSData.validationIssues(mvsData)}`);
    }

    await loadMVS(molstar, mvsData, {
        appendSnapshots: false,
        keepCamera: false,
        extensions: [],
    });

    return extractViewsFromMVS(mvsData);
}

// TODO: all functions in this file have to handle errors based on some result pattern so we can progate error message above
export async function loadDataFromFile(fileData: FileData | null) {
    if (!molstar) throw new Error("Molstar is not initialized!");

    if (!fileData) return null;

    await clearViewer();

    if (fileData.extension === "mvsj") {
        return await loadMVSJFile(fileData.content as string);
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
            fileData.extension as any
        );

        await molstar.builders.structure.hierarchy.applyPreset(
            trajectory,
            "default"
        );
    } catch (error) {
        console.log(
            "Error occured when loading data from file: <",
            error,
            ">."
        );
        return null;
    }

    return null;
}
