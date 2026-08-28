/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import {
    MVSData,
    type MVSData_States,
    type Snapshot,
} from "molstar/lib/extensions/mvs/mvs-data";
import {
    copyNode,
    replaceNodeIdsWithMolstarUrls,
    replaceNodeIdsWithRelativePaths,
    replaceNodeUrlsWithIds,
} from "./mvsNode";
import { createDefaultMVS } from "./mvs";

/**
 * Creates copy of the given snapshot in the state tree.
 * @param stateTree state tree
 * @param index index of the snapshot to copy, the copy will be pushed to the array as last elemenet
 * @returns if index is out of range, it returns original state tree and undefined instead of new copy, otherwise it returns updated state tree and the copy of snapshot itself
 */
export function createCopyOfSnapshotInTree(
    stateTree: MVSData_States,
    index: number,
) {
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
 *
 * @param stateTree state tree
 * @param index of snapshot to remove
 * @returns both the new state tree and the removed snapshot if index is valid, otherwise unchanged tree and undefined
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
        const data = createDefaultMVS(stateTree.metadata);

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
