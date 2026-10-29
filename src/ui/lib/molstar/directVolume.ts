/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Grid, type Volume } from "molstar/lib/mol-model/volume";
import { DirectVolumeParams } from "molstar/lib/mol-repr/volume/direct-volume";
import { ParamDefinition as PD } from "molstar/lib/mol-util/param-definition";
import type { MolstarLoadingExtension } from "molstar/lib/extensions/mvs/load";
import { UpdateTarget } from "molstar/lib/extensions/mvs/load-generic";
import { alphaForNode, clippingForNode } from "molstar/lib/extensions/mvs/load-helpers";
import { Mat4, Tensor, Vec3 } from "molstar/lib/mol-math/linear-algebra";
import { CustomProperties } from "molstar/lib/mol-model/custom-property";
import { PluginStateObject as SO } from "molstar/lib/mol-plugin-state/objects";
import { VolumeRepresentation3D } from "molstar/lib/mol-plugin-state/transforms/representation";
import { StateTransformer, StateTree } from "molstar/lib/mol-state";
import { getMolstar } from "./instance";
import {
    type TransferColorStop,
    type TransferControlPoint,
    type TransferFunction,
} from "../../features/viewer/models/MvsViewModels";
import { convertHexStringToColor } from "./utils";

/**
 * Shape of the `custom.transfer_function` payload stored on a
 * `volume_representation` MVS node when the view model's type is "direct_volume".
 * The node's official `params.type` stays "isosurface" as a graceful fallback
 * for viewers that do not understand the custom field (same pattern as the
 * camera thumbnail on `camera` nodes).
 */
export interface TransferFunctionCustom {
    control_points: [number, number][];
    color_stops: [number, string][];
}

/**
 * Serializes a view-model transfer function into the MVS `custom` payload.
 * @param transferFunction transfer function
 * @returns serializable custom payload
 */
export function transferFunctionToCustom(
    transferFunction: TransferFunction,
): TransferFunctionCustom {
    return {
        control_points: transferFunction.controlPoints.map((p) => [p[0], p[1]]),
        color_stops: transferFunction.colorStops.map((s) => [s.x, s.color]),
    };
}

/**
 * Parses an MVS `custom` payload back into a view-model transfer function.
 * Returns undefined when the payload is not valid.
 * @param custom custom payload
 * @returns transfer function or undefined
 */
export function customToTransferFunction(custom: any): TransferFunction | undefined {
    const controlPoints = custom?.control_points;
    const colorStops = custom?.color_stops;

    if (!Array.isArray(controlPoints) || !Array.isArray(colorStops)) {
        return undefined;
    }

    const points: TransferControlPoint[] = [];
    for (const p of controlPoints) {
        if (!Array.isArray(p) || p.length !== 2) return undefined;
        const x = Number(p[0]);
        const alpha = Number(p[1]);
        if (!Number.isFinite(x) || !Number.isFinite(alpha)) return undefined;
        points.push([x, alpha]);
    }

    const stops: TransferColorStop[] = [];
    for (const s of colorStops) {
        if (!Array.isArray(s) || s.length !== 2) return undefined;
        const x = Number(s[0]);
        const color = String(s[1]);
        if (!Number.isFinite(x) || !color.startsWith("#")) return undefined;
        stops.push({ x, color });
    }

    if (points.length === 0 || stops.length === 0) {
        return undefined;
    }

    return { controlPoints: points, colorStops: stops };
}

/**
 * Builds the full `VolumeRepresentation3D` params for direct volume rendering
 * from a custom transfer function payload.
 * @param custom custom payload
 * @param alpha overall opacity multiplier (from the MVS `opacity` node)
 * @param clip clipping params (from the MVS `clipping` child node), if any
 * @returns params for the `VolumeRepresentation3D` transformer
 */
function buildDirectVolumeRepresentationParams(
    custom: TransferFunctionCustom,
    alpha: number,
    clip?: any,
) {
    // Defaults of Mol*'s DirectVolume geometry params, overridden with our
    // transfer function. Params are replaced wholesale, so the object must be
    // complete.
    const directVolumeDefaults = PD.getDefaultValues(DirectVolumeParams);

    return {
        type: {
            name: "direct-volume",
            params: {
                ...directVolumeDefaults,
                controlPoints: custom.control_points.map((p) => [p[0], p[1]]),
                alpha,
                ...(clip !== undefined ? { clip } : {}),
            },
        },
        colorTheme: {
            name: "volume-value",
            params: {
                colorList: {
                    kind: "interpolate",
                    // Mol*'s palette sizes its color table from the decimal
                    // precision of the stop offsets (10^precision entries), so
                    // full double-precision offsets (e.g. from pointer drags)
                    // blow it up with "Invalid array length". Keep offsets to
                    // 3 decimals.
                    colors: custom.color_stops
                        .slice()
                        .sort((a, b) => a[0] - b[0])
                        .map((s) => [
                            convertHexStringToColor(s[1]),
                            Math.round(s[0] * 1000) / 1000,
                        ]),
                },
            },
        },
    };
}

// Direct volume rendering uploads the whole grid into a WebGL 3D texture
// (RGBA, one texel per voxel), which easily exceeds GPU limits for large
// maps (e.g. a 2048x2048x76 grid needs ~1.3 GB). Mol* itself just refuses to
// render such volumes ("volume too large for direct-volume rendering"), so
// we transparently downsample the grid before the representation is built.

/** Voxel budget for the 3D texture (~128 MB as an RGBA uint8 texture). */
const MAX_DIRECT_VOLUME_VOXELS = 32_000_000;

/** Per-axis cap; also comfortably below Mol*'s max3dTextureSize / 2 check. */
const MAX_DIRECT_VOLUME_DIMENSION = 512;

/**
 * Computes integer per-axis strides so that the downsampled grid stays within
 * the voxel and per-dimension budgets. The axis with the currently largest
 * dimension is coarsened first, so anisotropic grids (e.g. 2048x2048x76) keep
 * their thin axes at full resolution.
 * @param dimensions grid dimensions
 * @param maxDimension per-axis cap after downsampling
 * @returns per-axis strides (all 1 when the grid already fits)
 */
function computeDownsamplingStrides(
    dimensions: ReadonlyArray<number>,
    maxDimension: number,
): [number, number, number] {
    const strides: [number, number, number] = [1, 1, 1];

    const fits = () => {
        let voxels = 1;
        for (let i = 0; i < 3; i++) {
            const d = Math.ceil(dimensions[i] / strides[i]);
            if (d > maxDimension) return false;
            voxels *= d;
        }
        return voxels <= MAX_DIRECT_VOLUME_VOXELS;
    };

    let guard = 0;
    while (!fits() && guard++ < 4096) {
        let axis = 0;
        for (let i = 1; i < 3; i++) {
            if (
                Math.ceil(dimensions[i] / strides[i]) >
                Math.ceil(dimensions[axis] / strides[axis])
            ) {
                axis = i;
            }
        }
        strides[axis]++;
    }

    return strides;
}

/**
 * Downsamples a volume by block-averaging `strides[i]` voxels along each
 * axis, preserving the grid's position and extent in cartesian space.
 * Statistics (min/max/mean/sigma) are recomputed for the new data.
 * @param volume volume to downsample
 * @param strides per-axis strides
 * @returns downsampled volume
 */
function downsampleVolume(volume: Volume, strides: [number, number, number]): Volume {
    const cells = volume.grid.cells;
    const oldDims = cells.space.dimensions;
    const oldData = cells.data;
    const oldOffset = cells.space.dataOffset;

    const newDims: [number, number, number] = [
        Math.ceil(oldDims[0] / strides[0]),
        Math.ceil(oldDims[1] / strides[1]),
        Math.ceil(oldDims[2] / strides[2]),
    ];
    const newSpace = Tensor.Space(
        newDims,
        cells.space.axisOrderSlowToFast.slice() as number[],
        Float32Array,
    );
    const newData = newSpace.create();
    const newOffset = newSpace.dataOffset;

    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    let sumSq = 0;
    let count = 0;

    for (let z = 0; z < newDims[2]; z++) {
        const z0 = z * strides[2];
        const z1 = Math.min(z0 + strides[2], oldDims[2]);
        for (let y = 0; y < newDims[1]; y++) {
            const y0 = y * strides[1];
            const y1 = Math.min(y0 + strides[1], oldDims[1]);
            for (let x = 0; x < newDims[0]; x++) {
                const x0 = x * strides[0];
                const x1 = Math.min(x0 + strides[0], oldDims[0]);

                let acc = 0;
                let samples = 0;
                for (let zz = z0; zz < z1; zz++) {
                    for (let yy = y0; yy < y1; yy++) {
                        for (let xx = x0; xx < x1; xx++) {
                            acc += oldData[oldOffset(xx, yy, zz)];
                            samples++;
                        }
                    }
                }

                const value = samples > 0 ? acc / samples : 0;
                newData[newOffset(x, y, z)] = value;
                if (value < min) min = value;
                if (value > max) max = value;
                sum += value;
                sumSq += value * value;
                count++;
            }
        }
    }

    const mean = count > 0 ? sum / count : 0;

    // 'spacegroup' transforms derive the per-voxel scale from the grid's own
    // dimensions, so they need no adjustment. 'matrix' transforms map grid
    // indices directly to cartesian space and must be rescaled instead.
    let transform = volume.grid.transform;
    if (transform.kind === "matrix") {
        const scale = Mat4.fromScaling(
            Mat4(),
            Vec3.create(
                oldDims[0] / newDims[0],
                oldDims[1] / newDims[1],
                oldDims[2] / newDims[2],
            ),
        );
        transform = {
            kind: "matrix",
            matrix: Mat4.mul(Mat4(), transform.matrix, scale),
        };
    }

    const grid: Grid = {
        transform,
        cells: Tensor.create(newSpace, newData),
        stats: {
            min: Number.isFinite(min) ? min : 0,
            max: Number.isFinite(max) ? max : 0,
            mean,
            sigma: count > 0 ? Math.sqrt(Math.max(0, sumSq / count - mean * mean)) : 0,
        },
        periodicity: volume.grid.periodicity,
    };

    return {
        label: volume.label,
        entryId: volume.entryId,
        grid,
        instances: volume.instances,
        sourceData: volume.sourceData,
        customProperties: new CustomProperties(),
        _propertyData: Object.create(null),
        _localPropertyData: Object.create(null),
    };
}

const MolViewStudioTransforms = StateTransformer.Builder.build("molviewstudio");

/**
 * `Volume -> Volume` state transformer that downsamples the input grid so it
 * fits into a WebGL 3D texture. Applied (via the loading extension below)
 * between the `volume` node and its direct-volume representation; volumes
 * that already fit pass through unchanged.
 */
const DownsampleVolumeForDirectVolume = MolViewStudioTransforms({
    name: "downsample-volume-for-direct-volume",
    display: {
        name: "Downsample Volume",
        description: "Downsample a volume grid for direct volume rendering.",
    },
    from: SO.Volume.Data,
    to: SO.Volume.Data,
    params: {},
})({
    apply({ a }, plugin: any) {
        const volume = a.data;
        const max3dTextureSize = plugin?.canvas3d?.webgl?.max3dTextureSize;
        const maxDimension = Math.min(
            MAX_DIRECT_VOLUME_DIMENSION,
            Math.floor((max3dTextureSize ?? 2048) / 2),
        );

        const strides = computeDownsamplingStrides(
            volume.grid.cells.space.dimensions,
            maxDimension,
        );

        if (strides[0] === 1 && strides[1] === 1 && strides[2] === 1) {
            return new SO.Volume.Data(volume);
        }
        return new SO.Volume.Data(downsampleVolume(volume, strides));
    },
});

/**
 * Context shared across the extension's `action` calls while a single tree is
 * being loaded.
 */
interface DirectVolumeExtensionContext {
    /** Target of the most recently loaded `volume` MVS node (post-transform). */
    volumeTarget?: UpdateTarget;
}

/**
 * MVS loading extension which renders `volume_representation` nodes carrying
 * `custom.transfer_function` as Mol* direct volumes (via the `volume-value`
 * color theme).
 *
 * The stock MVS loader first creates the isosurface representation from the
 * official `params.type: "isosurface"` fallback; this extension then deletes
 * it and rebuilds the branch as:
 *
 *   volume -> downsample-for-direct-volume -> volume-representation-3d
 *
 * so that even grids too large for a WebGL 3D texture (which Mol* outright
 * refuses to render) display correctly.
 */
export const DirectVolumeLoadingExtension: MolstarLoadingExtension<DirectVolumeExtensionContext> =
    {
        id: "molviewstudio/direct-volume",
        description:
            "Render volume_representation nodes with custom.transfer_function as direct volumes.",
        createExtensionContext: () => ({}),
        action: (updateTarget, node, _context, extensionContext) => {
            // `volume_representation` nodes are always children of a `volume`
            // node, which the loader visits first - remember where its data
            // landed so the replacement branch can be attached there.
            if (node.kind === "volume") {
                extensionContext.volumeTarget = updateTarget;
                return;
            }

            if (node.kind !== "volume_representation") return;

            const custom = (node as any).custom?.transfer_function;
            if (!custom?.control_points || !custom?.color_stops) return;

            const params = buildDirectVolumeRepresentationParams(
                custom,
                alphaForNode(node as any),
                clippingForNode(node as any),
            );

            const volumeTarget = extensionContext.volumeTarget;
            if (!volumeTarget) {
                // No volume target recorded (should not happen for valid MVS
                // trees) - fall back to rewriting the fallback representation's
                // params in place, without the downsampling safety net.
                updateTarget.update.to(updateTarget.selector).update((old: any) => ({
                    ...old,
                    ...params,
                }));
                return;
            }

            // Replace the isosurface fallback representation created by the stock
            // loader with the downsampled direct-volume chain. Delete by the raw
            // ref string: resolving the selector object would look the ref up in
            // the LIVE state, where it does not exist yet (nothing is committed
            // during the virtual load), silently turning the delete into a no-op
            // and leaving the isosurface rendered next to the direct volume.
            updateTarget.update.delete(updateTarget.selector.ref);
            const downsampled = UpdateTarget.apply(
                volumeTarget,
                DownsampleVolumeForDirectVolume,
                {},
            );
            UpdateTarget.apply(downsampled, VolumeRepresentation3D, params);
        },
    };

/**
 * Retrieves the `VolumeData` currently loaded in Molstar for a given asset,
 * located through the `mvs-ref:vol-<assetId>` tag the MVS loader puts on the
 * state node created from the asset's `volume` node.
 * @param assetId render asset ID (the download URL used in the tree)
 * @returns volume data or undefined when not loaded (yet)
 */
export function getVolumeDataForAsset(assetId: string): Volume | undefined {
    const molstar = getMolstar();
    if (!molstar) return undefined;

    const state = molstar.state.data;

    // Preferred: the tag set on the volume node. Resolve through the state
    // TREE, not the cells: on a reload, `updateTree` keeps cells whose params
    // (and therefore transform version) did not change, and kept cells retain
    // their STALE tags from an earlier load (e.g. the ref from a freshly
    // opened .mvsj). The tree always reflects the latest loaded tags, and the
    // cell for the (deterministic) ref still holds the volume object.
    const tag = `mvs-ref:vol-${assetId}`;
    let found: Volume | undefined;
    StateTree.doPreOrder(state.tree, state.tree.root, undefined, (transform) => {
        if (found !== undefined || !transform.tags?.includes(tag)) return;
        const cell = state.cells.get(transform.ref);
        if (cell?.obj) {
            found = cell.obj.data as Volume;
            return false;
        }
    });
    if (found !== undefined) return found;

    // Cells-based lookup (covers states where cells were created after the
    // tag was set, e.g. right after a fresh viewer init).
    for (const [, cell] of state.cells) {
        if (cell.transform.tags?.includes(tag) && cell.obj) {
            return cell.obj.data as Volume;
        }
    }

    // Fallback for trees built before the volume node carried a ref (or when
    // the tag is missing for any other reason): find the volume data cell by
    // walking its ancestors up to the asset's download node, whose `url`
    // param is the asset ID.
    for (const [ref, cell] of state.cells) {
        if (!cell.obj || (cell.obj as any).type !== SO.Volume.Data.type) continue;
        let parent = cell.transform.parent;
        while (parent && parent !== ref) {
            const parentCell = state.cells.get(parent);
            if (!parentCell) break;
            if (parentCell.transform.params?.url === assetId) {
                return cell.obj.data as Volume;
            }
            const next = parentCell.transform.parent;
            // The root transform's parent is its own ref - stop there, the
            // walk would otherwise cycle on it forever.
            if (next === parent) break;
            parent = next;
        }
    }
    return undefined;
}

/** Companion of `getVolumeDataForAsset` - the tag `getVolumeNode` sets on the volume node. */
export const VOLUME_NODE_REF_PREFIX = "vol-";

/** Normalizes a value into [0, 1] given the volume's [min, max] range. */
function toNormalized(value: number, min: number, max: number): number {
    const range = max - min;
    if (range <= 0 || !Number.isFinite(range)) return 0.5;
    return Math.min(0.999, Math.max(0.001, (value - min) / range));
}

/** Builds a narrow peak (iso-surface-like) around a normalized position. */
function buildPeakPoints(
    cx: number,
    halfWidth: number,
    alpha: number,
): TransferControlPoint[] {
    const ramp = 0.005;
    return [
        [Math.max(0.001, cx - halfWidth), 0],
        [Math.min(0.999, cx - halfWidth + ramp), alpha],
        [Math.min(0.999, cx + halfWidth - ramp), alpha],
        [Math.min(0.999, cx + halfWidth), 0],
    ];
}

export interface TransferFunctionPreset {
    label: string;
    controlPoints: TransferControlPoint[];
}

/**
 * Computes data-aware transfer function presets from a volume's robust
 * statistics, mirroring Mol*'s own direct-volume presets (mean/sigma based,
 * zero bin excluded).
 * @param volume volume data
 * @returns list of presets
 */
export function getTransferFunctionPresets(
    volume: Volume | undefined,
): TransferFunctionPreset[] {
    if (!volume) return [];

    const { min, max } = volume.grid.stats;
    if (max - min <= 0 || !Number.isFinite(max - min)) return [];

    const robust = Grid.getRobustStats(volume.grid, { ignoreZero: true });
    const { mean, sigma, p99 } = robust;

    if (!Number.isFinite(sigma) || sigma <= 0 || robust.count === 0) {
        return [];
    }

    const toX = (v: number) => toNormalized(v, min, max);
    const presets: TransferFunctionPreset[] = [];

    if (min < 0) {
        // Signed (e.g. difference) map: mirrored peaks around 0.
        const neg = toX(mean - 3 * sigma);
        const pos = toX(mean + 3 * sigma);
        presets.push({
            label: "Difference map (±3σ)",
            controlPoints: [
                ...buildPeakPoints(neg, 0.012, 0.05),
                ...buildPeakPoints(pos, 0.012, 0.05),
            ],
        });
        presets.push({
            label: "Ramp (auto, symmetric)",
            controlPoints: [
                [toX(Math.min(mean - 3 * sigma, -sigma)), 0.05],
                [toX(-sigma), 0.025],
                [toX(0), 0.0],
                [toX(sigma), 0.025],
                [toX(Math.max(mean + 3 * sigma, sigma)), 0.05],
            ],
        });
    } else {
        // Unsigned map: smooth ramp from the mean towards high density.
        presets.push({
            label: "Ramp (auto)",
            controlPoints: [
                [toX(mean), 0.0],
                [toX(mean + sigma), 0.025],
                [toX(Math.min(mean + 3 * sigma, p99)), 0.05],
                [Math.min(0.999, toX(Math.min(mean + 3 * sigma, p99)) + 0.002), 0.05],
            ],
        });
        presets.push({
            label: "Sharp surface (~+2σ)",
            controlPoints: buildPeakPoints(toX(mean + 2 * sigma), 0.012, 0.05),
        });
        presets.push({
            label: "High contour (~+3σ)",
            controlPoints: buildPeakPoints(toX(mean + 3 * sigma), 0.015, 0.08),
        });
    }

    return presets;
}
