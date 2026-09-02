/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { type MVSTree } from "molstar/lib/extensions/mvs/tree/mvs/mvs-tree";
import { type Base64Png, type CameraState, type HexColor } from "./types";
import { ColorT } from "molstar/lib/extensions/mvs/tree/mvs/param-types";
import { getEulerAnglesFromMatrix3x3, getRotationMatrix3x3 } from "./math";
import type {
    ComponentEntry,
    StructureViewModel,
} from "../../features/viewer/models/MvsViewModels";

/**
 * Creates a deep copy of `node`.
 * @param node node to copy
 * @returns copy of node
 */
export function copyNode(node: MVSTree) {
    return structuredClone(node);
}

/**
 * Creates a deep copy of `node` and applies camera-related changes to the copy, which is then returned.
 * @param node node to copy and apply changes to
 * @param referenceCamera camera
 * @param thumbnail thumbnail
 * @returns copy of original `node` with applied changes
 */
export function applyCameraToNode(
    node: MVSTree,
    referenceCamera?: CameraState | undefined,
    thumbnail?: Base64Png,
): MVSTree {
    const nodeCopy = copyNode(node);

    if (referenceCamera) {
        const { position, target, up } = referenceCamera;

        const cameraNode = nodeCopy.children?.find(
            (child) => child.kind === "camera",
        );

        if (cameraNode) {
            cameraNode.params = {
                position: Array.from(position) as [number, number, number],
                target: Array.from(target) as [number, number, number],
                up: Array.from(up) as [number, number, number],
            };

            if (thumbnail) {
                cameraNode.custom = {
                    ...(cameraNode.custom || {}),
                    thumbnail: thumbnail,
                };
            } else if (cameraNode.custom) {
                delete cameraNode.custom.thumbnail;

                if (Object.keys(cameraNode.custom).length === 0) {
                    delete cameraNode.custom;
                }
            }
        } else {
            const newCameraNode: any = {
                kind: "camera" as const,
                params: {
                    position: Array.from(position) as [number, number, number],
                    target: Array.from(target) as [number, number, number],
                    up: Array.from(up) as [number, number, number],
                },
            };

            if (thumbnail) {
                newCameraNode.custom = { thumbnail: thumbnail };
            }

            if (!nodeCopy.children) {
                nodeCopy.children = [];
            }
            nodeCopy.children.unshift(newCameraNode);
        }
    }

    return nodeCopy;
}

/**
 * Creates a deep copy of `node` and applies background color.
 * @param node node to copy and apply changes to
 * @param backgroundColor color
 * @returns copy of original `node` with applied changes
 */
export function applyBackgroundColorToNode(
    node: MVSTree,
    backgroundColor?: HexColor,
): MVSTree {
    const nodeCopy = copyNode(node);

    if (backgroundColor) {
        const canvasNode = nodeCopy.children?.find(
            (child) => child.kind === "canvas",
        );

        if (canvasNode) {
            canvasNode.params = {
                background_color: backgroundColor as ColorT,
            };
        } else {
            const newCanvasNode = {
                kind: "canvas" as const,
                params: {
                    background_color: backgroundColor as ColorT,
                },
            };

            if (!nodeCopy.children) {
                nodeCopy.children = [];
            }
            nodeCopy.children.push(newCanvasNode);
        }
    } else {
        if (nodeCopy.children) {
            nodeCopy.children = nodeCopy.children.filter(
                (child) => child.kind !== "canvas",
            );
        }
    }

    return nodeCopy;
}

/**
 * Remove download node from the state tree.
 * @param rootNode root node
 * @param assetIdToRemove managed asset id in download node which will be removed
 * @returns modified node
 */
export function removeDownloadNodeFromRoot(
    rootNode: MVSTree,
    assetIdToRemove: string,
) {
    return {
        ...rootNode,
        children: rootNode.children?.filter((child: any) => {
            if (
                child.kind === "download" &&
                child.params?.url === assetIdToRemove
            ) {
                return false;
            }
            return true;
        }),
    };
}

/**
 * Add new structure asset to the download node with default values.
 *
 * @param rootNode root node
 * @param assetIdToAdd managed asset id
 * @param extension extension of the file
 * @param extensionParserRecord record of mapped extension and its parser type
 * @param params drafted parameters from the UI to use instead of defaults (everything but `format`,
 *   since format is derived from the extension the same way it is for volume)
 * @returns modified node
 */
export function addStructureDownloadNodeToRoot(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rootNode: any,
    assetIdToAdd: string,
    extension: string,
    extensionParserRecord: Record<string, string>,
    params: Omit<StructureViewModel, "format">,
) {
    // Default format (parser) is "bcif". If it does not match to data, Molstar will throw an error when reloading this view anyway.
    const format: string = extensionParserRecord[extension] ?? "bcif";

    const structureParams: Record<string, unknown> = {
        type: params.type,
        block_header: params.block_header,
        block_index: params.block_index,
        model_index: params.model_index,
        coordinates_ref: params.coordinates_ref,
    };
    if (params.type === "assembly") {
        structureParams.assembly_id = params.assembly_id;
    }
    if (params.type === "symmetry_mates") {
        structureParams.radius = params.radius;
    }
    if (params.type === "symmetry") {
        structureParams.ijk_min = params.ijk_min;
        structureParams.ijk_max = params.ijk_max;
    }

    const newDownloadBranch = {
        kind: "download",
        params: { url: assetIdToAdd },
        children: [
            {
                kind: "parse",
                params: { format: format },
                children: [
                    {
                        kind: "structure",
                        params: structureParams,
                        children: params.components.map(buildComponentNode),
                    },
                ],
            },
        ],
    };

    return {
        ...rootNode,
        children: [...(rootNode.children || []), newDownloadBranch],
    };
}

/**
 * Add new asset to the download node with default values.
 *
 * @param rootNode root node
 * @param assetIdToAdd managed asset id
 * @param extension extension of the file
 * @param extensionParserRecord record of mapped extension and its parser type
 * @param params optional drafted parameters from the UI to use instead of defaults
 * @returns modified node
 */
export function addVolumeDownloadNodeToRoot(
    rootNode: any,
    assetIdToAdd: string,
    extension: string,
    extensionParserRecord: Record<string, string>,
    params: {
        type: string;
        relative_isovalue: number;
        show_wireframe: boolean;
        show_faces: boolean;
        color: string;
        opacity: number;
    },
) {
    // Default format (parser) is "bcif". If it does not match to data, Molstar will throw an error when reloading this view anyway.
    const format: string = extensionParserRecord[extension] ?? "bcif";

    // Use provided params from the UI, or fallback to the standard Mol* defaults.
    const type = params.type;
    const relative_isovalue = params.relative_isovalue;
    const show_wireframe = params.show_wireframe;
    const show_faces = params.show_faces;
    const color = params.color;
    const opacity = params.opacity;

    const newDownloadBranch = {
        kind: "download",
        params: { url: assetIdToAdd },
        children: [
            {
                kind: "parse",
                params: { format: format },
                children: [
                    {
                        kind: "volume",
                        children: [
                            {
                                kind: "transform",
                                params: {
                                    translation: [0, 0, 0],
                                    rotation: [1, 0, 0, 0, 1, 0, 0, 0, 1], // Identity matrix.
                                },
                            },
                            {
                                kind: "volume_representation",
                                params: {
                                    type: type,
                                    relative_isovalue: relative_isovalue,
                                    show_wireframe: show_wireframe,
                                    show_faces: show_faces,
                                },
                                children: [
                                    {
                                        kind: "color",
                                        params: { color: color },
                                    },
                                    {
                                        kind: "opacity",
                                        params: { opacity: opacity },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    };

    return {
        ...rootNode,
        children: [...(rootNode.children || []), newDownloadBranch],
    };
}

/**
 * Declares, per parent node kind, which immediate child to auto-create (with
 * what default params) when a param update targets a node that either *is*
 * that child, or lives further down the branch through that child.
 *
 * Only covers node kinds that occur exactly once per asset branch. `component`
 * and everything under it are handled separately (see `setStructureComponents
 * InAssetBranch` below) since there can be many of them.
 */
const AUTO_REPAIR_RULES: Record<
    string,
    Record<
        string,
        { childKind: string; defaultParams: Record<string, unknown> }
    >
> = {
    // volume node — unchanged from the existing volume behavior
    volume: {
        transform: {
            childKind: "transform",
            defaultParams: {
                translation: [0, 0, 0],
                rotation: [1, 0, 0, 0, 1, 0, 0, 0, 1],
            },
        },
    },
    // volume_representation node — unchanged from the existing volume behavior
    volume_representation: {
        color: { childKind: "color", defaultParams: {} },
        opacity: { childKind: "opacity", defaultParams: {} },
    },
};

/**
 * Recursively updates a parameter inside a specific node kind, but only for the branch belonging to the target asset id.
 * It will auto-repair a missing child node (e.g. `transform`) if it doesn't exist, per AUTO_REPAIR_RULES.
 * Not used for `component` and its descendants — see `setStructureComponentsInAssetBranch`.
 *
 * @param node node to update, start with root
 * @param targetAssetId node which is updated has to have this id as download url
 * @param targetNodeKind node type to update, e.g. "structure", "transform"
 * @param paramKey parameter to update, e.g. "type"
 * @param paramValue value which will used to update
 * @param inTargetBranch recursive helper parameter
 * @returns updated node
 */
export function updateNodeParamInAssetBranch(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    node: any,
    targetAssetId: string,
    targetNodeKind: string,
    paramKey: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paramValue: any,
    inTargetBranch: boolean = false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
    let isCurrentlyInTargetBranch = inTargetBranch;
    if (node.kind === "download" && node.params?.url === targetAssetId) {
        isCurrentlyInTargetBranch = true;
    }

    let newParams = node.params;
    let newChildren = node.children;

    if (isCurrentlyInTargetBranch) {
        if (node.kind === targetNodeKind) {
            newParams = {
                ...newParams,
                [paramKey]: paramValue,
            };
        } else {
            const rule = AUTO_REPAIR_RULES[node.kind]?.[targetNodeKind];
            if (rule) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const childExists = (node.children || []).some(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (c: any) => c.kind === rule.childKind,
                );

                if (!childExists) {
                    newChildren = [
                        ...(node.children || []),
                        {
                            kind: rule.childKind,
                            params: { ...rule.defaultParams },
                        },
                    ];
                }
            }
        }
    }

    if (Array.isArray(newChildren) && newChildren.length > 0) {
        newChildren = newChildren.map((child: any) =>
            updateNodeParamInAssetBranch(
                child,
                targetAssetId,
                targetNodeKind,
                paramKey,
                paramValue,
                isCurrentlyInTargetBranch,
            ),
        );
    }

    return {
        ...node,
        params: newParams,
        ...(newChildren !== undefined ? { children: newChildren } : {}),
    };
}

/**
 * Builds a full `component` node subtree (component -> representation -> [color,
 * opacity], optionally -> focus) from a single ComponentEntry.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildComponentNode(entry: ComponentEntry): any {
    const representationParams: Record<string, unknown> = {
        type: entry.representationType,
        size_factor: entry.size_factor,
    };
    if (entry.representationType === "cartoon") {
        representationParams.tubular_helices = entry.tubular_helices;
    }
    if (
        entry.representationType === "ball_and_stick" ||
        entry.representationType === "line" ||
        entry.representationType === "spacefill" ||
        entry.representationType === "surface"
    ) {
        representationParams.ignore_hydrogens = entry.ignore_hydrogens;
    }
    if (entry.representationType === "surface") {
        representationParams.surface_type = entry.surface_type;
    }
    if (entry.representationType === "putty") {
        representationParams.size_theme = entry.size_theme;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const componentChildren: any[] = [
        {
            kind: "representation",
            params: representationParams,
            children: [
                { kind: "color", params: { color: entry.color } },
                { kind: "opacity", params: { opacity: entry.opacity } },
            ],
        },
        {
            kind: "transform",
            params: {
                translation: [
                    entry.translationX,
                    entry.translationY,
                    entry.translationZ,
                ],
                rotation: getRotationMatrix3x3(
                    entry.rotationX,
                    entry.rotationY,
                    entry.rotationZ,
                ),
            },
        },
    ];
    if (entry.show_focus) {
        componentChildren.push({
            kind: "focus",
            params: { direction: entry.focus_direction, up: entry.focus_up },
        });
    }

    return {
        kind: "component",
        params: { selector: entry.selector },
        children: componentChildren,
    };
}

/**
 * Replaces ALL `component` children of the `structure` node in the target
 * asset's branch with freshly built ones from `components`, in order.
 * Non-`component` children of `structure` (i.e. `transform`) are preserved.
 * This is a wholesale replace rather than a per-field patch, since there can
 * be any number of components and MVS gives them no stable identity to match
 * against — much simpler and correct-by-construction on every call.
 *
 * @param root root of source tree
 * @param assetId asset id of the target branch
 * @param components the full desired list of components, in display order
 * @returns modified root
 */
export function setStructureComponentsInAssetBranch(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    root: any,
    assetId: string,
    components: ComponentEntry[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function traverse(node: any, inBranch: boolean): any {
        let isInBranch = inBranch;
        if (node.kind === "download" && node.params?.url === assetId) {
            isInBranch = true;
        }

        if (isInBranch && node.kind === "structure") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const nonComponentChildren = (node.children || []).filter(
                (c: any) => c.kind !== "component",
            );
            const newComponentChildren = components.map(buildComponentNode);
            return {
                ...node,
                children: [...nonComponentChildren, ...newComponentChildren],
            };
        }

        if (Array.isArray(node.children) && node.children.length > 0) {
            return {
                ...node,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                children: node.children.map((child: any) =>
                    traverse(child, isInBranch),
                ),
            };
        }

        return node;
    }

    return traverse(root, false);
}

/**
 * Reads one ComponentEntry out of a `component` node's subtree.
 * `id` is generated fresh since MVS doesn't persist any component identity.
 */
function readComponentEntry(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    componentNode: any,
    id: string,
): ComponentEntry {
    const entry: ComponentEntry = {
        id,
        selector: "all",
        representationType: "cartoon",
        size_factor: 1,
        ignore_hydrogens: false,
        tubular_helices: false,
        surface_type: "molecular",
        size_theme: "uniform",
        color: "#ffffff",
        opacity: 1.0,
        show_focus: false,
        focus_direction: [0, 0, -1],
        focus_up: [0, 1, 0],
        translationX: 0,
        translationY: 0,
        translationZ: 0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
    };

    if (componentNode.params?.selector !== undefined) {
        entry.selector = componentNode.params.selector;
    }

    for (const child of componentNode.children || []) {
        if (child.kind === "representation" && child.params) {
            if (child.params.type !== undefined)
                entry.representationType = child.params.type;
            if (child.params.size_factor !== undefined)
                entry.size_factor = child.params.size_factor;
            if (child.params.ignore_hydrogens !== undefined)
                entry.ignore_hydrogens = child.params.ignore_hydrogens;
            if (child.params.tubular_helices !== undefined)
                entry.tubular_helices = child.params.tubular_helices;
            if (child.params.surface_type !== undefined)
                entry.surface_type = child.params.surface_type;
            if (child.params.size_theme !== undefined)
                entry.size_theme = child.params.size_theme;

            for (const grandchild of child.children || []) {
                if (grandchild.kind === "color" && grandchild.params?.color) {
                    entry.color = grandchild.params.color;
                }
                if (
                    grandchild.kind === "opacity" &&
                    grandchild.params?.opacity !== undefined
                ) {
                    entry.opacity = grandchild.params.opacity;
                }
            }
        }

        if (child.kind === "focus" && child.params) {
            entry.show_focus = true;
            if (
                Array.isArray(child.params.direction) &&
                child.params.direction.length === 3
            ) {
                entry.focus_direction = child.params.direction;
            }
            if (
                Array.isArray(child.params.up) &&
                child.params.up.length === 3
            ) {
                entry.focus_up = child.params.up;
            }
        }

        if (child.kind === "transform" && child.params) {
            if (
                Array.isArray(child.params.translation) &&
                child.params.translation.length === 3
            ) {
                entry.translationX = child.params.translation[0];
                entry.translationY = child.params.translation[1];
                entry.translationZ = child.params.translation[2];
            }
            if (
                Array.isArray(child.params.rotation) &&
                child.params.rotation.length === 9
            ) {
                const [pitch, yaw, roll] = getEulerAnglesFromMatrix3x3(
                    child.params.rotation,
                );
                entry.rotationX = pitch;
                entry.rotationY = yaw;
                entry.rotationZ = roll;
            }
        }
    }

    return entry;
}

/**
 * Retrieves current parameters of a specific download node branch for a structure asset.
 *
 * @param rootNode root node
 * @param assetId asset id, see ManagedAsset
 * @param defaultValues default values to use if the params cannot be retrieved from the node
 * @returns extracted information
 */
export function getStructureParamsForAsset(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rootNode: any,
    assetId: string,
    defaultValues: StructureViewModel,
): StructureViewModel {
    const params = { ...defaultValues };
    let componentIdCounter = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function traverse(node: any, inBranch: boolean) {
        let currentInBranch = inBranch;

        if (node.kind === "download" && node.params?.url === assetId) {
            currentInBranch = true;
        }

        if (currentInBranch) {
            if (node.kind === "parse" && node.params?.format !== undefined) {
                params.format = node.params.format;
            }

            if (node.kind === "structure") {
                if (node.params) {
                    if (node.params.type !== undefined)
                        params.type = node.params.type;
                    if (node.params.block_header !== undefined)
                        params.block_header = node.params.block_header;
                    if (node.params.block_index !== undefined)
                        params.block_index = node.params.block_index;
                    if (node.params.model_index !== undefined)
                        params.model_index = node.params.model_index;
                    if (node.params.coordinates_ref !== undefined)
                        params.coordinates_ref = node.params.coordinates_ref;
                    if (node.params.assembly_id !== undefined)
                        params.assembly_id = node.params.assembly_id;
                    if (node.params.radius !== undefined)
                        params.radius = node.params.radius;
                    if (
                        Array.isArray(node.params.ijk_min) &&
                        node.params.ijk_min.length === 3
                    ) {
                        params.ijk_min = node.params.ijk_min;
                    }
                    if (
                        Array.isArray(node.params.ijk_max) &&
                        node.params.ijk_max.length === 3
                    ) {
                        params.ijk_max = node.params.ijk_max;
                    }
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const componentNodes = (node.children || []).filter(
                    (c: any) => c.kind === "component",
                );
                if (componentNodes.length > 0) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    params.components = componentNodes.map((c: any) =>
                        readComponentEntry(
                            c,
                            `component-${componentIdCounter++}`,
                        ),
                    );
                }
            }
        }

        if (Array.isArray(node.children)) {
            for (const child of node.children) {
                traverse(child, currentInBranch);
            }
        }
    }

    traverse(rootNode, false);
    return params;
}

/**
 * Retrieves current parameters of specific download node branch.
 *
 * @param rootNode root node
 * @param assetId asset id, see ManagedAsset
 * @param defaultValues default values to use if the params cannot be retrieved from the node
 * @returns extracted information
 */
export function getVolumeParamsForAsset(
    rootNode: MVSTree,
    assetId: string,
    defaultValues: {
        format: string;
        type: string;
        relative_isovalue: number;
        show_wireframe: boolean;
        show_faces: boolean;
        color: string;
        opacity: number;
        translationX: number;
        translationY: number;
        translationZ: number;
        rotationX: number;
        rotationY: number;
        rotationZ: number;
    },
) {
    const params = { ...defaultValues };

    function traverse(node: any, inBranch: boolean) {
        let currentInBranch = inBranch;

        if (node.kind === "download" && node.params?.url === assetId) {
            currentInBranch = true;
        }

        if (currentInBranch) {
            if (node.kind === "parse" && node.params?.format !== undefined) {
                params.format = node.params.format;
            }

            if (node.kind === "volume_representation" && node.params) {
                if (node.params.type !== undefined)
                    params.type = node.params.type;
                if (node.params.relative_isovalue !== undefined)
                    params.relative_isovalue = node.params.relative_isovalue;
                if (node.params.show_wireframe !== undefined)
                    params.show_wireframe = node.params.show_wireframe;
                if (node.params.show_faces !== undefined)
                    params.show_faces = node.params.show_faces;
            }
            if (node.kind === "color" && node.params?.color) {
                params.color = node.params.color;
            }
            if (node.kind === "opacity" && node.params?.opacity !== undefined) {
                params.opacity = node.params.opacity;
            }

            if (node.kind === "transform" && node.params) {
                if (
                    Array.isArray(node.params.translation) &&
                    node.params.translation.length === 3
                ) {
                    params.translationX = node.params.translation[0];
                    params.translationY = node.params.translation[1];
                    params.translationZ = node.params.translation[2];
                }

                if (
                    Array.isArray(node.params.rotation) &&
                    node.params.rotation.length === 9
                ) {
                    const [pitch, yaw, roll] = getEulerAnglesFromMatrix3x3(
                        node.params.rotation,
                    );
                    params.rotationX = pitch;
                    params.rotationY = yaw;
                    params.rotationZ = roll;
                }
            }
        }

        if (Array.isArray(node.children)) {
            for (const child of node.children) {
                traverse(child, currentInBranch);
            }
        }
    }

    traverse(rootNode, false);
    return params;
}

/**
 * Traverses an MVS node and its children immutably.
 * Replaces any `url` parameters with the corresponding `ManagedAsset.id`.
 * @param node node
 * @param assets list of assets
 * @returns modified node
 */
export function replaceNodeUrlsWithIds(node: any, assets: ManagedAsset[]): any {
    let newParams = node.params;

    if (newParams && typeof newParams.url === "string") {
        const currentUrl = newParams.url;
        const normalizedCurrentUrl = currentUrl.startsWith("./")
            ? currentUrl.slice(2)
            : currentUrl;

        const matchedAsset = assets.find((a) => {
            const assetUrl =
                typeof a.asset === "string" ? a.asset : a.asset?.url;

            return (
                assetUrl === currentUrl ||
                a.relativePath === normalizedCurrentUrl
            );
        });
        if (matchedAsset) {
            newParams = {
                ...newParams,
                url: matchedAsset.id,
            };
        }
    } else if (newParams && typeof newParams.uri === "string") {
        const currentUri = newParams.uri;
        const normalizedCurrentUrl = currentUri.startsWith("./")
            ? currentUri.slice(2)
            : currentUri;

        const matchedAsset = assets.find((a) => {
            const assetUrl =
                typeof a.asset === "string" ? a.asset : a.asset?.url;

            return (
                assetUrl === currentUri ||
                a.relativePath === normalizedCurrentUrl
            );
        });

        if (matchedAsset) {
            newParams = {
                ...newParams,
                uri: matchedAsset.id,
            };
        }
    }

    let newChildren = node.children;
    if (Array.isArray(node.children) && node.children.length > 0) {
        newChildren = node.children.map((child: any) =>
            replaceNodeUrlsWithIds(child, assets),
        );
    }

    return {
        ...node,
        params: newParams,
        children: newChildren,
    };
}

/**
 * Replace asset IDs in node with arcp protocol url value.
 * @param node node
 * @param assets list of assets
 * @returns modified node
 */
export function replaceNodeIdsWithMolstarUrls(
    node: any,
    assets: ManagedAsset[],
): any {
    let newParams = node.params;

    if (newParams) {
        if (typeof newParams.url === "string") {
            const currentId = newParams.url;
            const matchedAsset = assets.find((a) => a.id === currentId);

            if (matchedAsset) {
                newParams = {
                    ...newParams,
                    url:
                        typeof matchedAsset.asset === "string"
                            ? matchedAsset.asset
                            : matchedAsset.asset.url,
                };
            }
        } else if (typeof newParams.uri === "string") {
            const currentId = newParams.uri;
            const matchedAsset = assets.find((a) => a.id === currentId);

            if (matchedAsset) {
                newParams = {
                    ...newParams,
                    uri:
                        typeof matchedAsset.asset === "string"
                            ? matchedAsset.asset
                            : matchedAsset.asset.url,
                };
            }
        }
    }

    let newChildren = node.children;
    if (Array.isArray(node.children) && node.children.length > 0) {
        newChildren = node.children.map((child: any) =>
            replaceNodeIdsWithMolstarUrls(child, assets),
        );
    }

    return {
        ...node,
        params: newParams,
        children: newChildren,
    };
}

/**
 * Traverses an MVS node and its children immutably.
 * Replaces any `url` or `uri` parameters matching an Asset ID back to its relative path.
 */
export function replaceNodeIdsWithRelativePaths(
    node: any,
    assets: ManagedAsset[],
): any {
    let newParams = node.params;

    if (newParams) {
        if (typeof newParams.url === "string") {
            const currentId = newParams.url;
            const matchedAsset = assets.find((a) => a.id === currentId);

            if (matchedAsset) {
                let newPath = matchedAsset.relativePath;
                if (matchedAsset.tag === "local" && !newPath.startsWith("./")) {
                    newPath = `./${newPath}`;
                }
                newParams = {
                    ...newParams,
                    url: newPath,
                };
            }
        } else if (typeof newParams.uri === "string") {
            const currentId = newParams.uri;
            const matchedAsset = assets.find((a) => a.id === currentId);

            if (matchedAsset) {
                let newPath = matchedAsset.relativePath;
                if (matchedAsset.tag === "local" && !newPath.startsWith("./")) {
                    newPath = `./${newPath}`;
                }
                newParams = {
                    ...newParams,
                    uri: newPath,
                };
            }
        }
    }

    let newChildren = node.children;
    if (Array.isArray(node.children) && node.children.length > 0) {
        newChildren = node.children.map((child: any) =>
            replaceNodeIdsWithRelativePaths(child, assets),
        );
    }

    return {
        ...node,
        params: newParams,
        children: newChildren,
    };
}
