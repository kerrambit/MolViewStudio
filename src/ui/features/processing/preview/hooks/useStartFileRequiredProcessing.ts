/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useCallback } from "react";
import { useStartFileProcessing } from "./useStartFileProcessing";
import { pickFileIndexByResolution } from "../../resolution/domain/pickFileByResolution";
import { getHighestPossibleResolution } from "../../resolution/domain/ResolutionLevel";
import { getFilenameWithoutExtension } from "../../../../utils/fileDataUtils";

export function useStartFileRequiredProcessing() {
    // Use processing.
    const { startFileProcessing } = useStartFileProcessing();

    const startFileRequiredProcessing = useCallback(
        async (
            file: FileData,
            type: "Volume" | "Segmentation",
            asset: ManagedAsset,
            relativePath: string,
        ) => {
            await startFileProcessing(
                file,
                type === "Segmentation" ? "Segmentation" : "Volume",
                {
                    downsampling_strategy: "null",
                    volume_serializer: "mrc",
                    segmentation_mask_serializer: "mrc",
                    segmentation_volume_serializer: "mrc",
                    segmentation_mesh_serializer: "mrc",
                    bundling_approach: "null",
                },
                "Asset",
                asset.id,
                (outputFiles: FileData[]) => {
                    if (!outputFiles || outputFiles.length === 0) {
                        return [];
                    }

                    const biggestIndex = pickFileIndexByResolution(
                        outputFiles,
                        getHighestPossibleResolution(),
                    );

                    const originalNameWithoutExtension =
                        getFilenameWithoutExtension(asset.name) ?? asset.name;
                    const name = `${originalNameWithoutExtension}.mrc`;

                    return [
                        {
                            assetIndex: biggestIndex,
                            relativePath: relativePath,
                            name: name,
                            hidden: false,
                            kind: "NecessaryConversion",
                            notify: true,
                        },
                    ];
                },
            );
        },
        [],
    );

    return {
        /**
         * Function starts required processing of a file. Does not change regime.
         */
        startFileRequiredProcessing,
    };
}
