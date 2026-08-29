/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { type TreeNodeData } from "@mantine/core";

export interface AssetTreeNode extends TreeNodeData {
    assetRef?: ManagedAsset;
    children?: AssetTreeNode[];
}

export function buildAssetTree(assets: ManagedAsset[]): AssetTreeNode[] {
    const root: AssetTreeNode[] = [];
    const folderMap: Record<string, AssetTreeNode> = {};

    assets.forEach((asset) => {
        const segments = asset.relativePath.split("/").filter(Boolean);
        const folderSegments = segments.slice(0, -1);

        let currentLevel = root;
        let runningPath = "";

        folderSegments.forEach((segment: string) => {
            const parentPath = runningPath;
            runningPath = runningPath ? `${runningPath}/${segment}` : segment;

            if (!folderMap[runningPath]) {
                const newFolder: AssetTreeNode = {
                    value: runningPath,
                    label: segment,
                    children: [],
                };
                folderMap[runningPath] = newFolder;

                if (parentPath && folderMap[parentPath]) {
                    folderMap[parentPath].children!.push(newFolder);
                } else {
                    root.push(newFolder);
                }
            }

            currentLevel = folderMap[runningPath].children!;
        });

        currentLevel.push({
            value: `file__${asset.asset.id}`,
            label: asset.name,
            assetRef: asset,
        });
    });

    return root;
}
