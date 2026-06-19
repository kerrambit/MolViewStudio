import { Asset } from "molstar/lib/mol-util/assets";
import { Vec3 } from "molstar/lib/mol-math/linear-algebra/3d";
import {
    GlobalMetadata,
    MVSData,
    type MVSData_States,
    type SnapshotMetadata,
} from "molstar/lib/extensions/mvs/mvs-data";
import { PluginState } from "molstar/lib/mol-plugin/state";
import { PluginStateSnapshotManager } from "molstar/lib/mol-plugin-state/manager/snapshots";
import type { MVSTree } from "molstar/lib/extensions/mvs/tree/mvs/mvs-tree";

/**
 * Type definition for color in hexadecimal format.
 */
export type HexColor = string;

/**
 * Base64 PNG type.
 */
export type Base64Png = string;

/**
 * Serialized form of in-memory MVSX assets that can survive plugin disposal.
 */
export interface SerializedAssets {
    entries: Array<{
        asset: Asset;
        isStatic?: boolean;
        data: Uint8Array;
    }>;
}

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
 * Download asset used in MVS.
 */
export type DownloadAsset = {
    relativeUrl: string;
    content: Uint8Array<ArrayBuffer>;
};

/**
 * Represents a single view metadata.
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
 * Session of Molstar viewer.
 */
export type Session = {
    snapshot: PluginState.Snapshot;
    assets: SerializedAssets;
    snapshotManagerState: PluginStateSnapshotManager.StateSnapshot;
};

/**
 * Result of `loadMVSXFile` function.
 */
export type LoadMVSXFileResult = {
    stateTree: MVSData;
    views: ViewMetadata[];
    assets: ManagedAsset[];
    sourceUrl: string;
};

/**
 * Result of `loadFromFile` function.
 */
export type LoadFromFileResult = {
    stateTree: MVSData_States;
    views: ViewMetadata[];
    assets: ManagedAsset[];
    sourceUrl: string;
};
