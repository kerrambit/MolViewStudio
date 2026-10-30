/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

/**
 * Ref prefixes for asset-kind MVS nodes, so the node created from an asset
 * can be found in Molstar state later.
 *
 * The MVS loader tags every state transform it creates with
 * `mvs-ref:<node.ref>`, so a node whose ref is `<prefix><assetId>` (set by
 * the node builders in `mvsNode.ts`, or retrofitted at import time by
 * `assignAssetNodeRefsToAssetIds` for trees loaded from files) can be
 * located in the state by the asset ID alone - see `getVolumeDataForAsset`
 * in `directVolume.ts`.
 */

/** Ref prefix of `volume` nodes: `vol-<assetId>`. */
export const VOLUME_NODE_REF_PREFIX = "vol-";

/** Ref prefix of `structure` nodes: `struct-<assetId>`. */
export const STRUCTURE_NODE_REF_PREFIX = "struct-";
