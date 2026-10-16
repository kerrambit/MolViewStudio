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
import type { ProcessVolumeRequestWithoutFilepaths } from "../../../config/processingDefinitions";
import {
    exportStateTree,
    injectRelativePathsBasedOnAssetIdsIntoTree,
    replaceHiddenAssetIdsByItsParentIdInTree,
} from "../../../lib/molstar";
import type { useWorkspaceManagement } from "../hooks/useWorkspaceManagement";
import { useUserSettingsStore } from "../../../stores/userSettingsStore";

/**
 * Runs the full export flow: shows the processing properties dialogue prefilled
 * with currently used Volume and Segmentation assets, starts processing jobs
 * for them (using paths resolved from `fileMappings.json`), and once all jobs
 * finish successfully, runs the final download which honors the chosen bundling.
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

    // Without Volume/Segmentation assets there is nothing to process: export the
    // current story directly (MVSX with bundled used assets, plain MVSJ if none).
    if (assetsToProcess.length === 0) {
        await continueExportAfterProcessing(new Map());
        return;
    }

    const volumeAssets = assetsToProcess.filter((asset) => asset.type === "Volume");
    const segmentationAssets = assetsToProcess.filter(
        (asset) => asset.type === "Segmentation",
    );

    // Let the user choose processing properties.
    const properties = await useDialogueStore
        .getState()
        .showDialogue<ProcessVolumeRequestWithoutFilepaths>({
            title: "Export processing properties",
            width: "900px",
            showCloseButton: true,
            content: (close) => (
                <ProcessingPropertiesDialogueContent
                    volumeAssets={volumeAssets}
                    segmentationAssets={segmentationAssets}
                    close={close}
                />
            ),
        });

    if (!properties) {
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

    // Begin the export and start one processing job per asset, using the resolved paths from file mappings.
    useExportStore.getState().beginExport(properties, mappedAssets.length);

    for (const asset of mappedAssets) {
        const path = getPath(asset.id)!;
        const jobId = await startExportProcessing(
            path,
            asset.type === "Segmentation",
            properties,
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

        useExportStore.getState().addExportJob(jobId);
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
 * The form of the final download honors the bundling approach chosen by the user:
 * `mvsx` exports the story as MVSX archive(s), other approaches download the
 * processed/bundled files themselves.
 * @param jobResults map of processing job ID → result paths of processed files
 */
async function continueExportAfterProcessing(
    jobResults: Map<ProcessingJobId, string[]>,
): Promise<void> {
    const exportState = useExportStore.getState();
    const bundling = exportState.properties?.bundling_approach ?? "mvsx";

    // For any bundling other than MVSX, the final download is the server's processing output itself.
    if (bundling !== "mvsx") {
        await downloadProcessingOutputs(jobResults);
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

    // Run the story MVSX export with the current assets.
    const assetsArray = Array.from(useManagedAssetsStore.getState().assets.values());

    const treeWithOnlyParentIds = replaceHiddenAssetIdsByItsParentIdInTree(
        regime.history.current().stateTree,
        assetsArray,
    );

    const treeWithRelativePaths = injectRelativePathsBasedOnAssetIdsIntoTree(
        treeWithOnlyParentIds,
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
    );

    if (result.success) {
        pushSuccessNotification(`Export ready!`);
    } else {
        pushErrorNotification(result.error.message);
    }

    exportState.resetExport();
}

/**
 * Downloads the output files of the export processing jobs as the final export result.
 * @param jobResults map of processing job ID → result paths of processed files
 */
async function downloadProcessingOutputs(
    jobResults: Map<ProcessingJobId, string[]>,
): Promise<void> {
    const processedFiles = Array.from(jobResults.values()).flat();

    // Read the processed files and download them to the user.
    const fileData = await window.electron.getFileData(processedFiles);

    if (fileData instanceof Error) {
        pushErrorNotification(
            `Export could not be finished, because the processed files could not be read! Details: <${fileData.message}>.`,
        );
        loggerUi.error(
            `Unable to read processed export files [${processedFiles}]! Details: <${fileData.message}>.`,
        );
        return;
    }

    // Download the processed files (bundles or raw files) via the browser download.
    for (const file of fileData) {
        const blob = new Blob([file.content as Uint8Array<ArrayBuffer> | string]);
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    pushSuccessNotification(`Export ready!`);
    loggerUi.info(`Export finished, downloaded files: <${processedFiles.join(", ")}>.`);
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
