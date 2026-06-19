import { Asset } from "molstar/lib/mol-util/assets";
import { clearViewer } from "./core";
import { getMolstar } from "./instance";
import { loadMVSJFile, loadMVSXFile } from "./mvs";
import {
    convertStateTreeFromSingleToMultipleKind,
    ensureAllSnapshotsHaveKeys,
} from "./mvsTree";
import { type LoadFromFileResult } from "./types";

/**
 * Loads data into viewer from the file.
 * @param fileData data to load
 * @returns assets, views, state tree and source url if success, undefined if file is not MVSX or MVSJ; Error otherwise
 */
export async function loadFromFile(
    fileData: FileData,
): Promise<LoadFromFileResult | undefined | Error> {
    const molstar = getMolstar();

    await clearViewer();

    if (fileData.extension === "mvsj") {
        const result = await loadMVSJFile(fileData.content as string);
        if (result.success) {
            return {
                stateTree: ensureAllSnapshotsHaveKeys(
                    convertStateTreeFromSingleToMultipleKind(
                        result.value.stateTree,
                    ),
                ),
                views: result.value.views,
                assets: result.value.assets,
                sourceUrl: "",
            };
        }
        return result.error;
    } else if (fileData.extension === "mvsx") {
        const result = await loadMVSXFile(
            fileData.content as Uint8Array<ArrayBuffer>,
        );
        if (result.success) {
            return {
                stateTree: ensureAllSnapshotsHaveKeys(
                    convertStateTreeFromSingleToMultipleKind(
                        result.value.stateTree,
                    ),
                ),
                views: result.value.views,
                assets: result.value.assets,
                sourceUrl: result.value.sourceUrl,
            };
        }
        return result.error;
    } else if (fileData.extension === "bcif") {
        fileData.extension = "mmcif";
    }

    const file = new File([fileData.content], fileData.name);
    const assetFile = Asset.File(file);

    try {
        const fileResult = await molstar.builders.data.readFile({
            file: assetFile,
            isBinary: fileData.binary,
        });

        const trajectory = await molstar.builders.structure.parseTrajectory(
            fileResult.data,
            fileData.extension as any,
        );

        await molstar.builders.structure.hierarchy.applyPreset(
            trajectory,
            "default",
        );
    } catch (error) {
        return new Error(
            `Error occured when loading data from file "${fileData.path}! Details: "${error}"."`,
        );
    }

    return undefined;
}
