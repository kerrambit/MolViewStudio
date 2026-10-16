/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useDialogueStore } from "../../../stores/dialogueStore";
import { useExportStore } from "../../../stores/exportStore";
import { useFileMappingsStore } from "../../../stores/fileMappingsStore";
import {
    isManagedAssetLocal,
    useManagedAssetsStore,
} from "../../../stores/managedAssetsStore";
import { useProcessingStore } from "../../../stores/processingStore";
import { useRegimeStore } from "../../../stores/regimeStore";
import {
    pushErrorNotification,
    pushInfoNotification,
    pushSuccessNotification,
    pushWarningNotification,
} from "../../../services/NotificationService";
import { loggerUi } from "../../../services/UiLoggingService";
import { ProcessingPropertiesDialogueContent } from "../../viewer/components/scene-manager/assets-sidebar/ProcessingPropertiesDialogueContent";
import type { ExportProcessingProperties } from "../../viewer/components/scene-manager/assets-sidebar/ProcessingPropertiesDialogueContent";
import {
    EXPORT_RESOLUTION_TO_INDEX,
    type ProcessVolumeRequestWithoutFilepaths,
} from "../../../config/processingDefinitions";
import {
    exportStateTree,
    injectRelativePathsBasedOnAssetIdsIntoTree,
    replaceHiddenAssetIdsByItsParentIdInTree,
    substituteAssetDownloadsInNode,
} from "../../../lib/molstar";
import type { MVSData_States } from "molstar/lib/extensions/mvs/mvs-data";
import type { useWorkspaceManagement } from "../hooks/useWorkspaceManagement";
import { useUserSettingsStore } from "../../../stores/userSettingsStore";

/**
 * Runs the full export flow: shows the processing properties dialogue prefilled
 * with currently used Volume and Segmentation assets, starts processing jobs
 * for them (using paths resolved from `fileMappings.json`), and once all jobs
 * finish successfully, runs the final export which honors the chosen bundling.
 * @param startExportProcessing processing starter from `useWorkspaceManagement`
 */
export async function runExportFlow(
    startExportProcessing: ReturnType<
        typeof useWorkspaceManagement
    >["startExportProcessing"],
): Promise<void> {
    const regime = useRegimeStore.getState().regime;
    if (regime.kind !== "viewing") {
        pushWarningNotification(
            `Export is currently unavailable! This usually happens if data is still processing, the file format is not supported (non-MVS), or the viewer is empty.`,
        );
        return;
    }

    const assetsToProcess = collectUsedAssetsToProcess(
        useUserSettingsStore.getState().settings.export.processAllLocalAssets,
    );

    const volumeAssets = assetsToProcess.filter((asset) => asset.type === "Volume");
    const segmentationAssets = assetsToProcess.filter(
        (asset) => asset.type === "Segmentation",
    );

    // Let the user choose processing properties and the output folder.
    const exportProperties = await useDialogueStore
        .getState()
        .showDialogue<ExportProcessingProperties>({
            title: "Export processing properties",
            width: "1000px",
            showCloseButton: true,
            content: (close) => (
                <ProcessingPropertiesDialogueContent
                    volumeAssets={volumeAssets}
                    segmentationAssets={segmentationAssets}
                    close={close}
                />
            ),
        });

    if (!exportProperties) {
        return;
    }

    // Without Volume/Segmentation assets there is nothing to process: export the
    // current story directly (MVSX with bundled used assets, plain MVSJ if none).
    if (assetsToProcess.length === 0) {
        useExportStore
            .getState()
            .beginExport(
                exportProperties.properties,
                exportProperties.outputPath,
                exportProperties.targetResolution,
                0,
            );
        await continueExportAfterProcessing(new Map());
        return;
    }

    // Resolve file paths of assets to process via file mappings.
    const getPath = useFileMappingsStore.getState().getPath;
    const unmappedAssetNames: string[] = [];
    const mappedAssets: ManagedAsset[] = [];

    for (const asset of assetsToProcess) {
        if (getPath(asset.id)) {
            mappedAssets.push(asset);
        } else {
            unmappedAssetNames.push(asset.name);
        }
    }

    if (unmappedAssetNames.length > 0) {
        pushErrorNotification(
            `Cannot process asset${
                unmappedAssetNames.length > 1 ? "s" : ""
            } ${unmappedAssetNames
                .map((name) => `"${name}"`)
                .join(
                    ", ",
                )} because their file mappings are missing! The export was cancelled.`,
        );
        loggerUi.error(
            `Missing file mappings for assets [${unmappedAssetNames.join(
                ", ",
            )}], export cancelled.`,
        );
        return;
    }

    // For MVSX bundling the story archive is built by the UI itself: the server
    // runs with raw output (no bundling, internal directory) and the UI embeds
    // the processed files into the final export.mvsx saved into the chosen folder.
    // For other bundling approaches the server writes its output directly into
    // the chosen folder.
    const isMvsxBundling = exportProperties.properties.bundling_approach === "mvsx";
    const serverProperties: ProcessVolumeRequestWithoutFilepaths = {
        ...exportProperties.properties,
        ...(isMvsxBundling
            ? { bundling_approach: "null", output_path: undefined }
            : { output_path: exportProperties.outputPath }),
    };

    // Begin the export and start one processing job per asset, using the resolved paths from file mappings.
    useExportStore
        .getState()
        .beginExport(
            exportProperties.properties,
            exportProperties.outputPath,
            exportProperties.targetResolution,
            mappedAssets.length,
        );

    for (const asset of mappedAssets) {
        const path = getPath(asset.id)!;
        const jobId = await startExportProcessing(
            path,
            asset.type === "Segmentation",
            serverProperties,
        );

        if (jobId instanceof Error) {
            pushErrorNotification(
                `Export was cancelled, because: "${jobId.message}"! You might need to restart the application and try once more.`,
            );
            loggerUi.error(
                `Export processing failed to start! See details: <${jobId.message}>.`,
            );

            // Abort the whole export.
            useExportStore.getState().resetExport();
            return;
        }

        // Register the job into the processing store, so its websocket is mounted and progress is tracked.
        useProcessingStore.getState().startJob(
            {
                path: path,
                extension: asset.extension,
                name: asset.name,
                binary: true,
                content: new Uint8Array(),
            },
            jobId,
            asset.type === "Segmentation" ? "Segmentation" : "Volume",
            undefined,
            undefined,
            "export",
        );

        useExportStore.getState().addExportJob(jobId, asset.id);
    }

    pushInfoNotification(
        `Export processing started. The export will continue automatically once all processing jobs finish.`,
    );
}

/**
 * Called when an export processing job finishes (successfully or not).
 * When all export jobs are finished, continues the export automatically;
 * if any of them failed, the whole export is cancelled.
 * @param jobId ID of the finished export processing job
 * @param error error message if the job failed, undefined otherwise
 */
export async function handleExportJobFinished(
    jobId: ProcessingJobId,
    error?: string,
): Promise<void> {
    const exportState = useExportStore.getState();

    if (exportState.status !== "processing") {
        return;
    }

    // If any export job failed, cancel the whole export.
    if (error) {
        pushErrorNotification(
            `Export was cancelled because processing failed! Details: <${error}>.`,
        );
        loggerUi.error(`Export processing job <${jobId}> failed: <${error}>.`);
        exportState.resetExport();
        return;
    }

    // Continue only when all expected export jobs were started and are finished.
    const jobs = useProcessingStore.getState().jobs;
    const allFinished =
        exportState.jobIds.size >= exportState.expectedJobCount &&
        Array.from(exportState.jobIds).every((id) => {
            const job = jobs.get(id);
            return job !== undefined && job.status !== "running";
        });

    if (!allFinished) {
        return;
    }

    // Any failed job would have cancelled the export already, so all succeeded here.
    const jobResults = new Map<ProcessingJobId, string[]>();
    for (const id of exportState.jobIds) {
        const job = jobs.get(id);
        if (job?.resultPaths) {
            jobResults.set(id, job.resultPaths);
        }
    }

    await continueExportAfterProcessing(jobResults);
}

/**
 * Continues the export once all export processing jobs have finished successfully.
 * The form of the final export honors the bundling approach chosen by the user:
 * `mvsx` exports the story as MVSX archive built by the UI with the processed
 * volumes embedded; other approaches were already written into the output
 * folder by the processing server itself.
 * @param jobResults map of processing job ID → result paths of processed files
 */
async function continueExportAfterProcessing(
    jobResults: Map<ProcessingJobId, string[]>,
): Promise<void> {
    const exportState = useExportStore.getState();
    const bundling = exportState.properties?.bundling_approach ?? "mvsx";
    const outputPath = exportState.outputPath!;

    // For any bundling other than MVSX, the server already wrote its output
    // into the chosen folder: the export is finished.
    if (bundling !== "mvsx") {
        const processedFiles = Array.from(jobResults.values()).flat();
        loggerUi.info(
            `Export finished, output files written into <${outputPath}>: <${processedFiles.join(
                ", ",
            )}>.`,
        );
        pushSuccessNotification(`Export ready! Saved into "${outputPath}".`);
        exportState.resetExport();
        return;
    }

    const regime = useRegimeStore.getState().regime;
    if (regime.kind !== "viewing") {
        pushErrorNotification(
            `Export could not be finished because the viewer session changed while processing!`,
        );
        exportState.resetExport();
        return;
    }

    const processedFiles = Array.from(jobResults.values()).flat();
    loggerUi.info(
        `Export processing finished with output files: <${processedFiles.join(", ")}>.`,
    );

    // Pick the processed file matching the chosen target resolution for each asset.
    const processedFilesByAssetId = await collectProcessedFilesByAssetId(jobResults);

    // Run the story MVSX export with the current assets.
    const assetsArray = Array.from(useManagedAssetsStore.getState().assets.values());

    const treeWithOnlyParentIds = replaceHiddenAssetIdsByItsParentIdInTree(
        regime.history.current().stateTree,
        assetsArray,
    );

    // Replace download nodes of processed assets by their processed files (URL and parse format).
    const treeWithSubstitutes: MVSData_States = {
        ...treeWithOnlyParentIds,
        snapshots: treeWithOnlyParentIds.snapshots.map((snapshot) => ({
            ...snapshot,
            root: substituteAssetDownloadsInNode(
                snapshot.root,
                processedFilesByAssetId,
            ),
        })),
    };

    const treeWithRelativePaths = injectRelativePathsBasedOnAssetIdsIntoTree(
        treeWithSubstitutes,
        assetsArray,
    );

    const bundleAllLocalAssets =
        useUserSettingsStore.getState().settings.export.bundleAllLocalAssets;

    const result = await exportStateTree(
        treeWithRelativePaths,
        assetsArray
            .filter(isManagedAssetLocal)
            .filter((a) => !a.hidden)
            .filter((a) => bundleAllLocalAssets || a.useCount > 0),
        processedFilesByAssetId,
        outputPath,
    );

    if (result.success) {
        pushSuccessNotification(`Export ready! Saved into "${outputPath}".`);
    } else {
        pushErrorNotification(result.error.message);
    }

    exportState.resetExport();
}

/**
 * Reads the processed files of all export jobs and picks, per processed asset,
 * the file matching the chosen target resolution (clamped to the resolutions
 * actually available). Expects `..._r{N}_...` naming produced by the mrc serializer.
 * @param jobResults map of processing job ID → result paths of processed files
 * @returns map of managed asset ID → chosen processed file
 */
async function collectProcessedFilesByAssetId(
    jobResults: Map<ProcessingJobId, string[]>,
): Promise<Map<AssetId, FileData>> {
    const exportState = useExportStore.getState();
    const targetResolution = exportState.targetResolution ?? "high";
    const targetIndex = EXPORT_RESOLUTION_TO_INDEX[targetResolution];

    const processedFiles = Array.from(jobResults.values()).flat();
    if (processedFiles.length === 0) {
        return new Map();
    }

    const filesData = await window.electron.getFileData(processedFiles);
    if (filesData instanceof Error) {
        loggerUi.error(
            `Unable to read processed export files [${processedFiles}]! Details: <${filesData.message}>.`,
        );
        return new Map();
    }

    const processedFilesByAssetId = new Map<AssetId, FileData>();
    for (const [jobId, resultPaths] of jobResults) {
        const assetId = exportState.jobIdAssetIds.get(jobId);
        if (!assetId) {
            continue;
        }

        const files = filesData.filter((file) => resultPaths.includes(file.path));
        if (files.length === 0) {
            continue;
        }

        // Parse the resolution index from the `..._r{N}_...` filename pattern.
        const resolutionOf = (file: FileData): number | undefined => {
            const match = file.name.match(/_r(\d+)_/);
            return match ? parseInt(match[1], 10) : undefined;
        };

        const availableResolutions = files
            .map(resolutionOf)
            .filter((resolution): resolution is number => resolution !== undefined);

        // Pick the resolution closest to the chosen target, clamped to the available range.
        let chosenFile: FileData;
        if (availableResolutions.length === 0) {
            chosenFile = files[0];
        } else {
            const clampedIndex = Math.min(targetIndex, Math.max(...availableResolutions));
            chosenFile =
                files.find((file) => resolutionOf(file) === clampedIndex) ??
                files.reduce((best, current) =>
                    Math.abs((resolutionOf(current) ?? 0) - clampedIndex) <
                    Math.abs((resolutionOf(best) ?? 0) - clampedIndex)
                        ? current
                        : best,
                );
        }

        processedFilesByAssetId.set(assetId, chosenFile);
    }

    return processedFilesByAssetId;
}

/**
 * Collects local Volume and Segmentation assets which are currently used in views.
 * If `shouldProcessAllLocalVolSegAssets` is set to true, we bypass the condition `asset must be used in view` and we process all Vol/Seg assets.
 * Hidden assets (e.g. previews) used in views are resolved to their parent assets.
 *
 * @returns unique array of managed assets to process
 */
function collectUsedAssetsToProcess(
    shouldProcessAllLocalVolSegAssets: boolean,
): ManagedAsset[] {
    const assets = Array.from(useManagedAssetsStore.getState().assets.values());

    // Map child asset ID -> parent asset, used to resolve hidden used assets to their parents.
    const parentByChildId = new Map<AssetId, ManagedAsset>();
    for (const asset of assets) {
        for (const child of asset.children) {
            parentByChildId.set(child.id, asset);
        }
    }

    const result = new Map<AssetId, ManagedAsset>();
    for (const asset of assets) {
        if (!isManagedAssetLocal(asset)) {
            continue;
        }

        if (!shouldProcessAllLocalVolSegAssets && asset.useCount <= 0) {
            continue;
        }

        // Hidden assets (e.g. previews) are replaced by their parents before processing.
        const target = asset.hidden ? parentByChildId.get(asset.id) ?? undefined : asset;

        if (!target) {
            continue;
        }

        if (target.type !== "Volume" && target.type !== "Segmentation") {
            continue;
        }

        result.set(target.id, target);
    }

    return Array.from(result.values());
}
