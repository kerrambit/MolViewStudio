/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Grid, type Volume } from "molstar/lib/mol-model/volume";
import { DirectVolumeParams } from "molstar/lib/mol-repr/volume/direct-volume";
import { ParamDefinition as PD } from "molstar/lib/mol-util/param-definition";
import type { MolstarLoadingExtension } from "molstar/lib/extensions/mvs/load";
import { alphaForNode, clippingForNode } from "molstar/lib/extensions/mvs/load-helpers";
import { PluginStateObject as SO } from "molstar/lib/mol-plugin-state/objects";
import { StateTree } from "molstar/lib/mol-state";
import { getMolstar } from "./instance";
import { VOLUME_NODE_REF_PREFIX } from "./nodeRefs";
import {
    type TransferColorStop,
    type TransferControlPoint,
    type TransferFunction,
} from "../../features/viewer/view-builder/domain/MvsViewModels";
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

/**
 * MVS loading extension which renders `volume_representation` nodes carrying
 * `custom.transfer_function` as Mol* direct volumes.
 *
 * The stock MVS loader first creates the isosurface representation from the
 * official `params.type: "isosurface"` fallback; this extension rewrites that
 * node's params in place to direct-volume params (the `volume-value` color
 * theme with the custom color stops, and the control points as the alpha
 * curve).
 *
 * Grids too large for a WebGL 3D texture are NOT handled here: Mol* itself
 * refuses to render them ("volume too large for direct-volume rendering"),
 * and the volume is expected to be downsampled in Processing first.
 */
export const DirectVolumeLoadingExtension: MolstarLoadingExtension<void> = {
    id: "volsegstudio/direct-volume",
    description:
        "Render volume_representation nodes with custom.transfer_function as direct volumes.",
    createExtensionContext: () => undefined,
    action: (updateTarget, node) => {
        if (node.kind !== "volume_representation") return;

        const custom = (node as any).custom?.transfer_function;
        if (!custom?.control_points || !custom?.color_stops) return;

        const params = buildDirectVolumeRepresentationParams(
            custom,
            alphaForNode(node as any),
            clippingForNode(node as any),
        );

        // Rewrite the fallback representation in place - same state node,
        // direct-volume params.
        updateTarget.update.to(updateTarget.selector).update((old: any) => ({
            ...old,
            ...params,
        }));
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

    const tag = `mvs-ref:${VOLUME_NODE_REF_PREFIX}${assetId}`;
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
