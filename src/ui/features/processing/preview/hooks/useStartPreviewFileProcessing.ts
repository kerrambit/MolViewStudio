/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useCallback } from "react";
import { useWorkspaceManagement } from "../../../workspace/hooks/useWorkspaceManagement";
import { pickFileIndexByResolution } from "../../resolution/domain/pickFileByResolution";
import { getLowestPossibleResolution } from "../../resolution/domain/ResolutionLevel";
import { getFilenameWithoutExtension } from "../../../../utils/fileDataUtils";

export function useStartPreviewFileProcessing() {
    // Use workspace.
    const { startFileProcessing } = useWorkspaceManagement();

    const startPreviewFileProcessing = useCallback(
        async (
            file: FileData,
            assetType: "Volume" | "Segmentation",
            asset: ManagedAsset,
            relativePath: string,
        ) => {
            await startFileProcessing(
                file,
                assetType,
                {
                    downsampling_strategy: "nearest",
                    volume_serializer: "mrc",
                    segmentation_mask_serializer: "mrc",
                    segmentation_volume_serializer: "mrc",
                    segmentation_mesh_serializer: "mrc",
                    bundling_approach: "null",
                },
                asset.id,
                "asset",
                (outputFiles: FileData[]) => {
                    if (!outputFiles || outputFiles.length === 0) {
                        return [];
                    }

                    const smallestIndex = pickFileIndexByResolution(
                        outputFiles,
                        getLowestPossibleResolution(),
                    );

                    // Name the preview same as the original file, with a "(Preview quality N)" suffix. N is incremented for each existing preview of the same original.
                    const previewQualityIndex = asset.children.length + 1;
                    const originalNameWithoutExtension =
                        getFilenameWithoutExtension(outputFiles[smallestIndex].name) ??
                        outputFiles[smallestIndex].name;
                    const previewName = `${originalNameWithoutExtension} (Preview quality ${previewQualityIndex}).mrc`;

                    return [
                        {
                            assetIndex: smallestIndex,
                            relativePath: relativePath,
                            name: previewName,
                            hidden: true,
                            kind: "Preview",
                            notify: false,
                        },
                    ];
                },
            );
        },
        [startFileProcessing],
    );

    return { startPreviewFileProcessing };
}
