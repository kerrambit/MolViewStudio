/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

/**
 * Id of the job.
 */
export type ProcessingJobId = string;

/**
 * Status of job.
 */
export type ProcessingJobStatus = "Running" | "Success" | "Error";

/**
 * Type of asset result after processing.
 */
export type ProcessingResultAssetType = "Volume" | "Segmentation";

// TODO: temporary type used only for export logic in `ProcessingJobSocket.ts`. Should be replaced in a way, that each job will have handle for onError and onDone with its custom logic.
export type ProcessingJobPurpose = "Export" | "Asset";

export type ProcessingJob = {
    jobId: ProcessingJobId;
    file: FileData;
    status: ProcessingJobStatus;
    assetType: ProcessingResultAssetType;
    purpose: ProcessingJobPurpose;
    stages: string[];
    resultPaths?: string[];
    errorMessage?: string;
    /**
     * Id of the parent managed asset this job was started for. Undefined for standalone jobs.
     */
    parentAssetId?: AssetId;
    /**
     * This callback is used when the job finished succefully.
     * It expects processed assets array and should return array of information about chosen assets from the processing.
     */
    chooseAssetsFunction?: (assets: FileData[]) => {
        assetIndex: number;
        relativePath: string;
        name: string;
        hidden: boolean;
        kind: ManagedAssetChildKind;
        notify: boolean;
    }[];
};
