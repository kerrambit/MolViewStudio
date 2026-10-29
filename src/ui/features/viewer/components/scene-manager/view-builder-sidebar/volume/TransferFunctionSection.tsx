/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
    Button,
    ColorInput,
    Collapse,
    Group,
    NumberInput,
    Select,
    Text,
} from "@mantine/core";
import { LineGraphComponent } from "molstar/lib/mol-plugin-ui/controls/line-graph/line-graph-component";
import type { Volume } from "molstar/lib/mol-model/volume";
import {
    getMolstar,
    getTransferFunctionPresets,
    getVolumeDataForAsset,
    isMolstarReloading,
} from "../../../../../../lib/molstar";
import "./TransferFunctionSection.css";
import {
    DEFAULT_TRANSFER_FUNCTION,
    type TransferColorStop,
    type VolumeViewModel,
} from "../../../../models/MvsViewModels";
import { CollapseTrigger } from "../../../../../../components/common/collapse-trigger/CollapseTriger";
import { UiLocalStorageService } from "../../../../../../services/UiLocalStorageService";
import { AssetBuilderCardSectionGroup } from "../AssetBuilderCardSectionGroup";
import { DeleteActionIcon } from "../../../../../../components/common/actionables/actions-icons/DeleteActionIcon";

type TransferFunctionSectionProps = {
    viewKey: string;
    assetId: string;
    renderAssetId: string;
    viewModel: VolumeViewModel;
    onUpdateParam: (
        key: keyof VolumeViewModel,
        val: VolumeViewModel[keyof VolumeViewModel],
        sync: boolean,
    ) => void;
};

/** Graph and color strip constants. */
const GRAPH_PADDING = 150;
const PLOT_WIDTH = 600;
const PLOT_HEIGHT = 350;
const GRAPH_VIEW_BOX_WIDTH = PLOT_WIDTH + GRAPH_PADDING;
const PLOT_X = GRAPH_PADDING / 2; // Where the color strip should start to be aligned with the plot starting coordinate.
const STRIP_HEIGHT = 45;

/** Linearly interpolates the gradient color at normalized position `x`. */
function interpolateColor(stops: TransferColorStop[], x: number): string {
    const sorted = [...stops].sort((a, b) => a.x - b.x);
    if (sorted.length === 0) {
    }

    if (x <= sorted[0].x) {
        return sorted[0].color;
    }

    if (x >= sorted[sorted.length - 1].x) {
        return sorted[sorted.length - 1].color;
    }

    for (let i = 0; i < sorted.length - 1; i++) {
        const a = sorted[i];
        const b = sorted[i + 1];
        if (x >= a.x && x <= b.x) {
            const t = b.x === a.x ? 0 : (x - a.x) / (b.x - a.x);
            const ca = parseInt(a.color.slice(1), 16);
            const cb = parseInt(b.color.slice(1), 16);
            const r = Math.round(((ca >> 16) & 0xff) * (1 - t) + ((cb >> 16) & 0xff) * t);
            const g = Math.round(((ca >> 8) & 0xff) * (1 - t) + ((cb >> 8) & 0xff) * t);
            const bl = Math.round((ca & 0xff) * (1 - t) + (cb & 0xff) * t);
            return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, "0")}`;
        }
    }
    return sorted[sorted.length - 1].color;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
class TransferFunctionLineGraph extends LineGraphComponent {
    constructor(props: any) {
        super(props);
        (this as any).padding = GRAPH_PADDING;
        (this as any).width = PLOT_WIDTH;
        (this as any).height = PLOT_HEIGHT;
    }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function TransferFunctionSection({
    viewKey,
    assetId,
    renderAssetId,
    viewModel,
    onUpdateParam,
}: TransferFunctionSectionProps) {
    // Store expanded section state.
    const [sectionExpanded, setSectionExpanded] = useState(() =>
        UiLocalStorageService.ViewBuilder.getExpandedVolumeTransferFunctionSection(
            assetId,
            viewKey,
        ),
    );

    // Volume data of the currently rendered asset.
    const [volume, setVolume] = useState<Volume | undefined>(() =>
        getVolumeDataForAsset(renderAssetId),
    );

    // Refreshes the volume data for asset change.
    useEffect(() => {
        const molstar = getMolstar();
        if (!molstar) return;

        const refresh = () => setVolume(getVolumeDataForAsset(renderAssetId));
        refresh();

        // Fires whenever Molstar finishes (re)building the state after a view
        // reload, so the volume data (histogram) follows the current tree.
        const subscription = molstar.state.data.events.changed.subscribe(refresh);

        // Watch the app's reload flag: it flips to false exactly when a reload has finished and the new volume data is available.
        let wasReloading = isMolstarReloading();
        const interval = setInterval(() => {
            const reloading = isMolstarReloading();
            if (wasReloading && !reloading) refresh();
            wasReloading = reloading;
        }, 250);

        return () => {
            subscription.unsubscribe();
            clearInterval(interval);
        };
    }, [renderAssetId]);

    // Current transfer function.
    const transferFunction = viewModel.transferFunction;

    // Readout shown while hovering an alpha control point.
    const [readout, setReadout] = useState<string>("");

    // Index (into the sorted stops) of the color stop selected in the strip.
    const [selectedColorStopIndex, setSelectedColorStopIndex] = useState<number | null>(
        null,
    );

    // While dragging a color stop, holds the working copy of the stops.
    const [dragStops, setDragStops] = useState<TransferColorStop[] | null>(null);

    // References to color strip components.
    const stripRef = useRef<SVGSVGElement>(null);
    const dragIndexRef = useRef<number | null>(null);
    const dragStartXRef = useRef(0);
    const dragMovedRef = useRef(false);
    const dragCreatedRef = useRef(false);

    // Stops are always handled in sorted (by x).
    const sortedColorStops = useMemo(
        () => [...(dragStops ?? transferFunction.colorStops)].sort((a, b) => a.x - b.x),
        [dragStops, transferFunction.colorStops],
    );

    // Selected color stop in the UI.
    const selectedColorStop =
        selectedColorStopIndex !== null
            ? sortedColorStops[selectedColorStopIndex]
            : undefined;

    // Data-aware presets derived from the volume's robust statistics.
    const presets = useMemo(() => getTransferFunctionPresets(volume), [volume]);

    const roundStops = (stops: TransferColorStop[]): TransferColorStop[] =>
        stops.map((stop) => ({ ...stop, x: Math.round(stop.x * 1000) / 1000 }));

    // Commits a new transfer function to the view model (and Molstar).
    const commitTransferFunction = (
        next: Partial<typeof transferFunction>,
        sync: boolean,
    ) => {
        const merged = { ...transferFunction, ...next };
        if (next.colorStops) {
            merged.colorStops = roundStops(next.colorStops);
        }
        onUpdateParam("transferFunction", merged, sync);
    };

    /**
     * Constructs label of a control point of alpha curve in a line graph.
     */
    const pointToLabel = (point?: [number, number]) => {
        if (!point) return `${transferFunction.controlPoints.length} points`;
        if (volume) {
            const { min, max, mean, sigma } = volume.grid.stats;
            const value = min + (max - min) * point[0];
            const sigmaOffset = sigma !== 0 ? (value - mean) / sigma : 0;
            return `(${value.toFixed(2)} | ${sigmaOffset.toFixed(2)}σ, ${point[1].toFixed(
                2,
            )})`;
        }
        return `(${point[0].toFixed(2)}, ${point[1].toFixed(2)})`;
    };

    // Converts a pointer event on the strip into a normalized x in [0, 1].
    const normalizeColorStripPointerEvent = (
        event: React.PointerEvent | React.MouseEvent,
    ) => {
        const svg = stripRef.current;
        if (!svg) {
            return 0;
        }

        const rect = svg.getBoundingClientRect();
        const viewBoxX =
            ((event.clientX - rect.left) / rect.width) * GRAPH_VIEW_BOX_WIDTH;
        return Math.min(1, Math.max(0, (viewBoxX - PLOT_X) / PLOT_WIDTH));
    };

    // Pressing close to an existing stop grabs it; pressing empty space
    // creates a new stop there (colored by the current gradient) and starts
    // dragging it right away, so adding and moving stops is one gesture.
    const handleStripPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
        const x = normalizeColorStripPointerEvent(event);

        const HIT_RADIUS = 24;
        let nearestIndex = -1;
        let nearestDistance = HIT_RADIUS;
        sortedColorStops.forEach((stop, i) => {
            const distance = Math.abs((stop.x - x) * PLOT_WIDTH);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = i;
            }
        });

        let stops: TransferColorStop[];
        let index: number;
        if (nearestIndex >= 0) {
            stops = [...sortedColorStops];
            index = nearestIndex;
        } else {
            stops = [
                ...sortedColorStops,
                { x, color: interpolateColor(sortedColorStops, x) },
            ].sort((a, b) => a.x - b.x);
            index = stops.findIndex((stop) => stop.x === x);
        }

        dragIndexRef.current = index;
        dragStartXRef.current = x;
        dragMovedRef.current = false;
        dragCreatedRef.current = nearestIndex < 0;
        setSelectedColorStopIndex(index);
        setDragStops(stops);
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handleStripPointerMove = (event: React.PointerEvent) => {
        if (dragIndexRef.current === null) return;
        const x = normalizeColorStripPointerEvent(event);
        const index = dragIndexRef.current;

        if (
            !dragMovedRef.current &&
            Math.abs((x - dragStartXRef.current) * PLOT_WIDTH) < 3
        ) {
            return;
        }
        dragMovedRef.current = true;
        setDragStops((prev) => {
            if (!prev) return prev;
            return prev.map((stop, i) => (i === index ? { ...stop, x } : stop));
        });
    };

    const handleStripPointerUp = () => {
        if (dragIndexRef.current === null || !dragStops) return;
        const stops = [...dragStops].sort((a, b) => a.x - b.x);
        const moved = dragMovedRef.current;
        const created = dragCreatedRef.current;
        dragIndexRef.current = null;
        setDragStops(null);
        if (moved || created) {
            commitTransferFunction({ colorStops: stops }, true);
        }
    };

    const gradientId = `tf-gradient-${assetId}`;

    // Render the component.
    return (
        <>
            <CollapseTrigger
                title={"Transfer Function"}
                titleTextSize={"md"}
                expanded={sectionExpanded}
                onClick={() => {
                    setSectionExpanded((prev) => {
                        const nextState = !prev;
                        UiLocalStorageService.ViewBuilder.setExpandedVolumeTransferFunctionSection(
                            assetId,
                            viewKey,
                            nextState,
                        );
                        return nextState;
                    });
                }}
            ></CollapseTrigger>

            <Collapse expanded={sectionExpanded}>
                <AssetBuilderCardSectionGroup
                    divider={true}
                    topMargin="sm"
                    bottomMargin="sm"
                >
                    <Select
                        label="Presets"
                        placeholder="Pick a preset"
                        size="xs"
                        data={presets.map((preset) => ({
                            value: preset.label,
                            label: preset.label,
                        }))}
                        value={null}
                        onChange={(label) => {
                            const preset = presets.find((p) => p.label === label);
                            if (preset) {
                                commitTransferFunction(
                                    { controlPoints: preset.controlPoints },
                                    true,
                                );
                            }
                        }}
                        disabled={presets.length === 0}
                    />

                    {/* Transfer function graph. */}
                    <div title={readout}>
                        <div
                            className="transfer-function-graph"
                            style={{
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            <TransferFunctionLineGraph
                                data={transferFunction.controlPoints}
                                volume={volume}
                                yAxis={{ scale: "log" }}
                                onChange={(points: [number, number][]) =>
                                    commitTransferFunction(
                                        { controlPoints: points },
                                        true,
                                    )
                                }
                                onDrag={(point: [number, number]) =>
                                    setReadout(pointToLabel(point))
                                }
                                onHover={(point?: [number, number]) =>
                                    setReadout(point ? pointToLabel(point) : "")
                                }
                            />
                        </div>
                    </div>

                    {/* Color strip. */}
                    <div>
                        <svg
                            ref={stripRef}
                            viewBox={`0 0 ${GRAPH_VIEW_BOX_WIDTH} ${STRIP_HEIGHT}`}
                            style={{
                                width: "100%",
                                display: "block",
                                cursor: "crosshair",
                            }}
                            onPointerDown={handleStripPointerDown}
                            onPointerMove={handleStripPointerMove}
                            onPointerUp={handleStripPointerUp}
                            onPointerLeave={handleStripPointerUp}
                        >
                            <defs>
                                <linearGradient
                                    id={gradientId}
                                    x1="0"
                                    y1="0"
                                    x2="1"
                                    y2="0"
                                >
                                    {sortedColorStops.length > 0 ? (
                                        sortedColorStops.map((stop, i) => (
                                            <stop
                                                key={i}
                                                offset={stop.x}
                                                stopColor={stop.color}
                                            />
                                        ))
                                    ) : (
                                        <stop offset={0} stopColor="#ffffff" />
                                    )}
                                </linearGradient>
                            </defs>
                            <rect
                                x={PLOT_X}
                                y={4}
                                width={PLOT_WIDTH}
                                height={STRIP_HEIGHT - 16}
                                fill={`url(#${gradientId})`}
                                stroke="var(--color-grey)"
                                strokeWidth={1}
                            />
                            {sortedColorStops.map((stop, i) => (
                                <circle
                                    key={i}
                                    cx={PLOT_X + stop.x * PLOT_WIDTH}
                                    cy={(STRIP_HEIGHT - 16) / 2 + 4}
                                    r={9}
                                    fill={stop.color}
                                    stroke={
                                        i === selectedColorStopIndex ? "white" : "black"
                                    }
                                    strokeWidth={i === selectedColorStopIndex ? 4 : 2}
                                    style={{ cursor: "grab" }}
                                />
                            ))}
                        </svg>
                        <div style={{ display: "flex", justifyContent: "center" }}>
                            <Text size="xs" c="dimmed" mt={2}>
                                Click empty space to add a color stop, drag one to move
                                it.
                            </Text>
                        </div>
                    </div>

                    {/* Editor for the selected color stop. */}
                    {selectedColorStop && (
                        <Group gap="xs" justify="center" wrap="nowrap">
                            <ColorInput
                                label="Stop color"
                                size="xs"
                                format="hex"
                                w={150}
                                withEyeDropper={false}
                                value={selectedColorStop.color}
                                onChange={(color) => {
                                    const stops = sortedColorStops.map((stop, i) =>
                                        i === selectedColorStopIndex
                                            ? { ...stop, color }
                                            : stop,
                                    );
                                    onUpdateParam(
                                        "transferFunction",
                                        { ...transferFunction, colorStops: stops },
                                        false,
                                    );
                                }}
                                onChangeEnd={(color) => {
                                    const stops = sortedColorStops.map((stop, i) =>
                                        i === selectedColorStopIndex
                                            ? { ...stop, color }
                                            : stop,
                                    );
                                    commitTransferFunction({ colorStops: stops }, true);
                                }}
                            />
                            <NumberInput
                                label="Position"
                                size="xs"
                                w={110}
                                value={selectedColorStop.x}
                                step={0.01}
                                min={0}
                                max={1}
                                onChange={(val) => {
                                    if (typeof val !== "number") return;
                                    const x = Math.min(1, Math.max(0, val));
                                    const stops = sortedColorStops
                                        .map((stop, i) =>
                                            i === selectedColorStopIndex
                                                ? { ...stop, x }
                                                : stop,
                                        )
                                        .sort((a, b) => a.x - b.x);
                                    setSelectedColorStopIndex(
                                        stops.findIndex((s) => s.x === x),
                                    );
                                    commitTransferFunction({ colorStops: stops }, true);
                                }}
                            />
                            <DeleteActionIcon
                                tooltip="Remove color stop."
                                onClick={() => {
                                    const stops = sortedColorStops.filter(
                                        (_, i) => i !== selectedColorStopIndex,
                                    );
                                    setSelectedColorStopIndex(null);
                                    commitTransferFunction({ colorStops: stops }, true);
                                }}
                                style={{ marginTop: "1.5em" }}
                            ></DeleteActionIcon>
                        </Group>
                    )}

                    <Button
                        style={{ width: "100%", marginTop: "1em" }}
                        variant="default"
                        size="compact-xs"
                        onClick={() => {
                            setSelectedColorStopIndex(null);
                            commitTransferFunction(
                                { ...structuredClone(DEFAULT_TRANSFER_FUNCTION) },
                                true,
                            );
                        }}
                    >
                        Reset to default
                    </Button>
                </AssetBuilderCardSectionGroup>
            </Collapse>
        </>
    );
}
