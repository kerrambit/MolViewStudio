import { type MVSTree } from "molstar/lib/extensions/mvs/tree/mvs/mvs-tree";
import { type Base64Png, type CameraState, type HexColor } from "./types";
import { ColorT } from "molstar/lib/extensions/mvs/tree/mvs/param-types";

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

        let cameraNode = nodeCopy.children?.find(
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
        let canvasNode = nodeCopy.children?.find(
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
 * Add new asset to the download node with default values.
 *
 * @param rootNode root node
 * @param assetIdToAdd managed asset id
 * @param extension extension of the file
 * @param extensionParserRecord recod of mapped extension and its parser type
 * @param params optional drafted parameters from the UI to use instead of defaults
 * @returns modified node
 */
export function addDownloadNodeToRoot(
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
 * Recursively updates a parameter inside a specific node kind, but only for the branch belonging to the target asset id.
 *
 * @param node node to update, start with root
 * @param targetAssetId node which is updated has to have this id as download url
 * @param targetNodeKind node type to update, e.g. "volume_representation" or "color"
 * @param paramKey parameter to update, e.g. "relative_isovalue"
 * @param paramValue value which will used to update
 * @param inTargetBranch recursive helper paramter
 * @returns updated node
 */
export function updateNodeParamInAssetBranch(
    node: any,
    targetAssetId: string,
    targetNodeKind: string,
    paramKey: string,
    paramValue: any,
    inTargetBranch: boolean = false,
): any {
    let isCurrentlyInTargetBranch = inTargetBranch;
    if (node.kind === "download" && node.params?.url === targetAssetId) {
        isCurrentlyInTargetBranch = true;
    }

    let newParams = node.params;

    if (isCurrentlyInTargetBranch && node.kind === targetNodeKind) {
        newParams = {
            ...newParams,
            [paramKey]: paramValue,
        };
    }

    let newChildren = node.children;
    if (Array.isArray(node.children) && node.children.length > 0) {
        newChildren = node.children.map((child: any) =>
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
        children: newChildren,
    };
}

/**
 * Retrieves current parameters of specific download node branch.
 *
 * @param rootNode root node
 * @param assetId asset id, see ManagedAsset
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
