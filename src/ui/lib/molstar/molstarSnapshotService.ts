import { PluginState } from "molstar/lib/mol-plugin/state";
import { getMolstar, getMolstarDontThrow } from "./instance";
import { UUID } from "molstar/lib/mol-util";
import { type HexColor } from "./types";
import { type Result } from "../../../types/Result";
import { convertHexStringToColor } from "./utils";
import { PluginCommands } from "molstar/lib/mol-plugin/commands";
import { checkMolstarAfterLoading } from "./core";

/**
 * Retrieves snapshot of manager state.
 * @returns Molstar snapshot manager state.
 */
export function getSnapshotManagerStateSnapshot() {
    const molstar = getMolstar();
    return molstar.managers.snapshot.getStateSnapshot();
}

/**
 * Clears all snapshots from the manager.
 */
export function clearAllSnapshotsFromSnapshotManager() {
    const molstar = getMolstar();
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
    const molstar = getMolstar();

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
    const molstar = getMolstar();

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
        const numericColor = convertHexStringToColor(backgroundColor);
        entry.snapshot.canvas3d.props.renderer.backgroundColor = numericColor;
    }

    molstar.managers.snapshot.replace(entry.snapshot.id, entry.snapshot, entry);

    return { success: true, value: null };
}

export function removeSnapshotInManager(index: number): Result<null> {
    const molstar = getMolstar();

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
    const molstar = getMolstar();

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
    const molstar = getMolstar();

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
    const molstar = getMolstar();

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
 * Returns current snapshot index. Defaults to index 0.
 * @returns current snapshot index
 */
export function getCurrentSnapshotIndex(): number {
    const molstar = getMolstarDontThrow();

    if (!molstar) {
        return 0;
    }

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
 * Tells Molstar's snapshot manager which snapshot it should render by its index.
 * @param index index of the snapshot
 * @returns if there is error, result with `Error` is returned, otherise null
 */
export async function applySnapshotByIndex(
    index: number,
): Promise<Result<null>> {
    const molstar = getMolstar();

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
