/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import type { MVSData_States } from "molstar/lib/extensions/mvs/mvs-data";
import { checkOffersProcessing } from "../../../assets/domain/assetsDefinitions";
import {
    replaceHiddenAssetIdsByItsParentIdInTree,
    substituteAssetDownloadsInNode,
    injectRelativePathsBasedOnAssetIdsIntoTree,
    exportStateTree,
} from "../../../../lib/molstar";
import {
    pushWarningNotification,
    pushErrorNotification,
    pushInfoNotification,
    pushSuccessNotification,
} from "../../../notifications/services/NotificationService";
import { loggerUi } from "../../../logger/services/UiLoggingService";
import { useDialogueStore } from "../../../dialogue/stores/dialogueStore";
import { useExportStore } from "../stores/exportStore";
import { useFileMappingsStore } from "../../../workspace/stores/fileMappingsStore";
import {
    isManagedAssetLocal,
    useManagedAssetsStore,
} from "../../../managed-assets/stores/managedAssetsStore";
import { useProcessingStore } from "../../../processing/stores/processingStore";
import { useUserSettingsStore } from "../../../settings/stores/userSettingsStore";
import {
    ExportDialogueContent,
    type ExportDialogueResultType,
} from "../components/ExportDialogueContent";
import {
    getFilePathWithoutFile,
    replaceFileExtension,
} from "../../../../utils/fileDataUtils";
import { pickFileByResolution } from "../../../processing/resolution/domain/pickFileByResolution";
import type { ProcessingJobId } from "../../../processing/domain/ProcessingJob";
import type { useStartFileProcessingForExport } from "../../../processing/export/hooks/useStartFileProcessingForExport";
import { useWindowsStore } from "../../stores/WindowsStore";
import type { ProcessVolumeRequestWithoutFilepaths } from "../../../processing/api/volume/ProcessVolumeRequest";
import { useRegimeStore } from "../../../regime/stores/regimeStore";

/**
 * Runs the full export flow: shows the processing properties dialogue prefilled
 * with currently used Volume and Segmentation assets, starts processing jobs
 * for them (using paths resolved from `fileMappings.json`), and once all jobs
 * finish successfully, runs the final export which honors the chosen bundling.
 * @param startExportProcessing processing starter from `useWorkspaceManagement`
 */
export async function runExportFlow(
    startExportProcessing: ReturnType<
        typeof useStartFileProcessingForExport
    >["startExportProcessing"],
): Promise<void> {
    const regime = useRegimeStore.getState().regime;
    if (regime.kind !== "viewing") {
        pushWarningNotification(
            `Export is currently unavailable! This usually happens if data is still processing, the file format is not supported (non-MVS), or the viewer is empty.`,
        );
        return;
    }

    if (useExportStore.getState().status === "processing") {
        pushWarningNotification(
            "One export is already running! Try once again after the first export is finished.",
        );
        return;
    }

    const assetsToProcess = collectUsedAssetsToProcess(
        useUserSettingsStore.getState().settings.export.processAllLocalAssets,
    );

    const volumeAssets = assetsToProcess.filter(
        (asset) => asset.type === "Volume" && checkOffersProcessing(asset.extension),
    );
    const segmentationAssets = assetsToProcess.filter(
        (asset) =>
            asset.type === "Segmentation" && checkOffersProcessing(asset.extension),
    );

    // Let the user choose processing properties and the output folder.
    const exportProperties = await useDialogueStore
        .getState()
        .showDialogue<ExportDialogueResultType>({
            title: "Export",
            width: "1000px",
            showCloseButton: true,
            content: (close) => (
                <ExportDialogueContent
                    volumeAssets={volumeAssets}
                    segmentationAssets={segmentationAssets}
                    close={close}
                />
            ),
        });

    if (!exportProperties) {
        return;
    }

    // For MVSX bundling the story archive is built by the UI itself: the server
    // runs with raw output (no bundling, internal directory) and the UI embeds
    // the processed files into the final `.mvsx` archive saved into the chosen folder.
    // TODO: code smell, we do not want to use directly api request, create facade object
    const serverProperties: ProcessVolumeRequestWithoutFilepaths = {
        ...exportProperties.properties,
        ...{ bundling_approach: "null", output_path: undefined },
    };

    // Without Volume/Segmentation assets there is nothing to process: export the
    // current story directly (MVSX with bundled used assets, plain MVSJ if none).
    if (assetsToProcess.length === 0) {
        useExportStore
            .getState()
            .beginExport(
                serverProperties,
                exportProperties.outputPath,
                exportProperties.filename,
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

    // If we cannot resolve some assets (no ID in file mappings, we stop the export.)
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

    // Begin the export and start one processing job per asset, using the resolved paths from file mappings.
    useExportStore
        .getState()
        .beginExport(
            serverProperties,
            exportProperties.outputPath,
            exportProperties.filename,
            exportProperties.targetResolution,
            mappedAssets.length,
        );

    useWindowsStore.getState().openWindow("processing-jobs");

    for (const asset of mappedAssets) {
        const path = getPath(asset.id)!;
        const jobId = await startExportProcessing(
            path,
            asset.type === "Segmentation",
            serverProperties,
        );

        if (jobId instanceof Error) {
            pushErrorNotification(
                `Export was cancelled! You might need to restart the application and try once more.`,
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
            "Export",
            undefined,
            undefined,
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
        pushErrorNotification(`Export was cancelled because processing failed!`);
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
            return job !== undefined && job.status !== "Running";
        });

    if (!allFinished) {
        return;
    }

    // Any failed job would have cancelled the export already, so all succeeded here.
    const jobResults = new Map<ProcessingJobId, string[]>();
    for (const id of exportState.jobIds) {
        const job = jobs.get(id);
        if (!job) {
            pushErrorNotification(
                `Internal error occurred when trying to handle finished export processing job with invalid ID: ${id}!`,
            );
            loggerUi.error(
                `Internal error occurred when trying to handle finished export processing job with invalid ID: ${id}!`,
            );
            continue;
        }

        if (!job.resultPaths || job.resultPaths.length <= 0) {
            pushWarningNotification(
                `No output files were produced for "${job.file.name}"! Will use original non-downsampled version.`,
            );
            loggerUi.warn(
                `No output files were produced for (export) processing job <${id}>!`,
            );
            continue;
        }

        jobResults.set(id, job.resultPaths);
    }

    await continueExportAfterProcessing(jobResults);
}

/**
 * Continues the export once all export processing jobs have finished successfully.
 * @param jobResults map of processing job ID -> result paths of processed files
 */
async function continueExportAfterProcessing(
    jobResults: Map<ProcessingJobId, string[]>,
): Promise<void> {
    const exportState = useExportStore.getState();
    const outputPath = exportState.outputPath!;
    const filepath = exportState.filename;

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
    const processedFilesByAsset = await collectProcessedFilesByAssetId(jobResults);

    // Run the story MVSX export with the current assets.
    const assetsArray = Array.from(useManagedAssetsStore.getState().assets.values());

    const treeWithOnlyParentIds = replaceHiddenAssetIdsByItsParentIdInTree(
        regime.history.current().stateTree,
        assetsArray,
    );

    // Replace download node IDs of original unprocessed assets with IDs of referenced processed assets.
    const treeWithSubstitutes: MVSData_States = {
        ...treeWithOnlyParentIds,
        snapshots: treeWithOnlyParentIds.snapshots.map((snapshot) => ({
            ...snapshot,
            root: substituteAssetDownloadsInNode(
                snapshot.root,
                processedFilesByAsset,
                assetsArray,
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
        treeWithSubstitutes,
        bundleAllLocalAssets,
        assetsArray.filter(isManagedAssetLocal),
        filepath,
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
 * actually available). Expects `..._r{N}_...` naming produced by the serializer.
 * @param jobResults map of processing job ID -> result paths of processed files
 * @returns map of managed asset ID -> chosen processed file
 */
async function collectProcessedFilesByAssetId(
    jobResults: Map<ProcessingJobId, string[]>,
): Promise<Map<AssetId, AssetId>> {
    const exportState = useExportStore.getState();
    const targetResolution = exportState.targetResolution ?? "high";

    const processedFiles = Array.from(jobResults.values()).flat();
    if (processedFiles.length === 0) {
        return new Map();
    }

    // TODO: we do not full `FileData` object here
    const filesData = await window.electron.getFileData(processedFiles);
    if (filesData instanceof Error) {
        loggerUi.error(
            `Unable to read processed export files [${processedFiles}]! Details: <${filesData.message}>.`,
        );
        pushErrorNotification(
            `Unable to read processed export files [${processedFiles}]! Will use original non-downsampled version of files.`,
        );
        return new Map();
    }

    const assets = Array.from(useManagedAssetsStore.getState().assets.values());

    const processedFilesByAssetId = new Map<AssetId, AssetId>();
    for (const [jobId, resultPaths] of jobResults) {
        const assetId = exportState.jobIdAssetIds.get(jobId);
        if (!assetId) {
            continue;
        }

        const files = filesData.filter((file) => resultPaths.includes(file.path));
        if (files.length === 0) {
            continue;
        }

        const chosenFile =
            pickFileByResolution<FileData>(files, targetResolution) ?? files[0];

        const managedAsset = assets.find((a) => a.id === assetId);
        if (!managedAsset) {
            loggerUi.error(`Managed asset with ID <${assetId}> was not found!`);
            pushErrorNotification(`Internal error occured!`);
            continue;
        }

        // Register processed export file as new ManagedAsset and store in file mappings.
        const newManagedAsset = useManagedAssetsStore
            .getState()
            .addLocalAssetWithExplicitName(
                chosenFile,
                getFilePathWithoutFile(managedAsset.relativePath),
                replaceFileExtension(managedAsset.name, chosenFile.extension),
                managedAsset.type,
                true,
            );

        if (!newManagedAsset) {
            continue;
        }

        useFileMappingsStore
            .getState()
            .resolveAndStoreMapping(newManagedAsset.id, chosenFile.path);

        processedFilesByAssetId.set(managedAsset.id, newManagedAsset.id);
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
        if (!isManagedAssetLocal(asset) || !checkOffersProcessing(asset.extension)) {
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
