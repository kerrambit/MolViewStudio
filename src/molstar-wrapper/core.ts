import { createPluginUI } from "molstar/lib/mol-plugin-ui";
import { renderReact18 } from "molstar/lib/mol-plugin-ui/react18";
import { DefaultPluginUISpec } from "molstar/lib/mol-plugin-ui/spec";
import { PluginSpec } from "molstar/lib/mol-plugin/spec";
import { MolViewSpec } from "molstar/lib/extensions/mvs/behavior";
import { getMolstar, setMolstar } from "./instance";
import { restoreSessionState } from "./restoreSessionService";
import { convertColorToHexString, convertHexStringToColor } from "./utils";
import { type Base64Png, type HexColor, type Session } from "./types";
import { clearAllSnapshotsFromSnapshotManager } from "./molstarSnapshotService";
import { Color } from "molstar/lib/mol-util/color";
import { type Result } from "../types/Result";

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
    previousSession: Session | null,
) {
    const plugin = await createPluginUI({
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

    setMolstar(plugin);

    if (previousSession) {
        await restoreSessionState(previousSession);
    }

    return plugin;
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
    const molstar = getMolstar();
    molstar.layout.setProps({
        regionState: { ...molstar.layout.state.regionState, [region]: state },
    });
}

/**
 * Clears the MVSX file assests in Molstar's manager.
 */
function clearMVSXFileAssets() {
    const molstar = getMolstar();
    molstar.managers.asset.clearTag("mvsx-file");
}

/**
 * Disposes current `PluginUIContext` (Molstar) instance.
 */
export function disposeMolstar() {
    const molstar = getMolstar();

    clearMVSXFileAssets();
    molstar.dispose();
    setMolstar(undefined);
}

/**
 * Clears the viewer, clears the snapshots and file assets.
 */
export async function clearViewer() {
    const molstar = getMolstar();
    clearAllSnapshotsFromSnapshotManager();
    clearMVSXFileAssets();
    await molstar.clear();
}

/**
 * Clears only the viewer content.
 */
export async function clearViewerContent() {
    const molstar = getMolstar();
    await molstar.clear();
}

/**
 * Retrieves Molstar snapshot.
 * @returns Molstar snaphot
 */
export function getMolstarStateSnapshot() {
    const molstar = getMolstar();
    return molstar.state.getSnapshot();
}

/**
 * Checks if Molstar contains any error after loading/reloading of data.
 * @returns result contains Error object, otherwise result contains only null if no error was found
 */
export function checkMolstarAfterLoading(): Result<null> {
    const molstar = getMolstar();

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

// --------------------------------------------------------------------------------------------------------

/**
 * Get background color.
 * @returns background color
 */
export function getBackgroundColor(): HexColor {
    return convertColorToHexString(
        getMolstarStateSnapshot().canvas3d?.props?.renderer.backgroundColor,
    );
}

/**
 * Sets background color.
 * @param color color to set
 */
export function setBackgroundColor(color: HexColor) {
    const molstar = getMolstar();

    const snapshot = getMolstarStateSnapshot();
    if (snapshot.canvas3d?.props) {
        snapshot.canvas3d.props.renderer.backgroundColor =
            convertHexStringToColor(color);
    }
    molstar.state.setSnapshot({ ...snapshot });
}

/**
 * Sets background color.
 * @param backgroundColor color to set
 */
export function updateLiveBackgroundColor(
    backgroundColor: HexColor | undefined,
): void {
    const molstar = getMolstar();

    if (!molstar.canvas3d) {
        return;
    }

    if (backgroundColor) {
        const numericColor = convertHexStringToColor(backgroundColor);

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
 * Retrieves canvas image in the form of Base64 PNG.
 * @returns screenshot as Base64 PNG, or undefined if it is not possible to retrieve a screenshot
 */
export async function getCanvasScreenshot(): Promise<Base64Png | undefined> {
    const molstar = getMolstar();
    return await molstar.helpers.viewportScreenshot?.getImageDataUri();
}
