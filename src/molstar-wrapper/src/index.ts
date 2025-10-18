import { createPluginUI } from "molstar/lib/mol-plugin-ui";
import { renderReact18 } from "molstar/lib/mol-plugin-ui/react18";
import { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";
import { DefaultPluginUISpec } from "molstar/lib/mol-plugin-ui/spec";
import { Asset, AssetManager } from "molstar/lib/mol-util/assets";
import { PluginState } from "molstar/lib/mol-plugin/state";
import { Color } from "molstar/lib/mol-util/color";
import { Vec3 } from "molstar/lib/mol-math/linear-algebra/3d";
import { MVSData } from "molstar/lib/extensions/mvs/mvs-data";
import { loadMVS } from "molstar/lib/extensions/mvs/load";
import { PluginSpec } from "molstar/lib/mol-plugin/spec";
import { MolViewSpec } from "molstar/lib/extensions/mvs/behavior";
import { RuntimeContext, Task } from "molstar/lib/mol-task";
import { murmurHash3_128_fromBytes } from "molstar/lib/mol-data/util";
import { unzip } from "molstar/lib/mol-util/zip/zip";

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

export type Base64Png = string;

export async function getCanvasImageAsUri(): Promise<Base64Png | undefined> {
    if (!molstar) throw new Error("Molstar is not initialized!");

    const helper = molstar.helpers.viewportScreenshot;
    return await helper?.getImageDataUri();
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

function decodeUtf8(bytes: Uint8Array): string {
    _decoder ??= new TextDecoder();
    return _decoder.decode(bytes);
}
let _decoder: TextDecoder | undefined;

async function _loadMVSXFile(
    runtimeCtx: RuntimeContext,
    data: Uint8Array<ArrayBuffer>,
    mainFilePath: string = "index.mvsj"
): Promise<{ mvsData: MVSData; sourceUrl: string }> {
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
    return { mvsData, sourceUrl };
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

    await molstar.runTask(
        Task.create("Load MVSX file", async (ctx) => {
            const parsed = await _loadMVSXFile(ctx, rawData);

            if (!molstar) throw new Error("Molstar is not initialized!");
            await loadMVS(molstar, parsed.mvsData, {
                sanityChecks: true,
                sourceUrl: parsed.sourceUrl,
            });
        })
    );
}

export async function loadDefaultMVSJFile() {
    if (!molstar) throw new Error("Molstar is not initialized!");
    const response = await fetch(
        "https://raw.githubusercontent.com/molstar/molstar/master/examples/mvs/1cbs.mvsj"
    );
    const rawData = await response.text();

    loadMVSJFile(rawData);
}

async function loadMVSJFile(rawData: string) {
    if (!molstar) throw new Error("Molstar is not initialized!");
    const mvsData: MVSData = MVSData.fromMVSJ(rawData);
    if (!MVSData.isValid(mvsData)) {
        console.log(MVSData.validationIssues(mvsData));
        throw new Error(`Oh no: ${MVSData.validationIssues(mvsData)}`);
    }

    await loadMVS(molstar, mvsData, {
        appendSnapshots: false,
        keepCamera: false,
        extensions: [],
    });
}

export async function loadDataFromFile(fileData: FileData | null) {
    if (!molstar) throw new Error("Molstar is not initialized!");

    if (!fileData) return false;

    await clearViewer();

    if (fileData.extension === "mvsj") {
        loadMVSJFile(fileData.content as string);
        return true;
    }

    if (fileData.extension === "mvsx") {
        loadMVSXFile(fileData.content as Uint8Array<ArrayBuffer>);
        return true;
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
        // TODO: all functions in this file have to handle errors based on some result pattern so we can progate error message above
        console.log(
            "Error occured when loading data from file: <",
            error,
            ">."
        );
        return false;
    }

    return true;
}
