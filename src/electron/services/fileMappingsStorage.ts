/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import path from "path";
import { existsSync, readFileSync } from "fs";
import { copyFile, mkdir, stat } from "fs/promises";
import { logger } from "../utils/logger.js";
import { saveFile } from "./fileStorageService.js";

/**
 * Name of the JSON file (relative to the user data folder) holding managed asset ID -> local file path mappings.
 */
const FILE_MAPPINGS_FILENAME = "fileMappings.json";

/**
 * If the original file is smaller than this threshold (in bytes), a copy is created
 * inside `Processing/Files` in the user data folder and the copy is used as the mapped path.
 * Bigger files are referenced by their original path.
 */
const FILE_COPY_SIZE_THRESHOLD = 250 * 1024 * 1024;

/**
 * Reads the file mappings JSON from the user data folder.
 * @param userDataPath path of the user data folder
 * @returns record of asset ID → resolved file path, empty record if the file does not exist yet
 */
export function loadFileMappings(userDataPath: string): Record<string, string> {
    return loadFileMappingsFromFile(
        path.join(userDataPath, "Processing", FILE_MAPPINGS_FILENAME),
    );
}

/**
 * Reads the file mappings JSON from an explicit file path.
 * @param mappingsFilePath path of the `fileMappings.json` file
 * @returns record of asset ID -> resolved file path, empty record on any read or parse error
 */
function loadFileMappingsFromFile(mappingsFilePath: string): Record<string, string> {
    try {
        if (!existsSync(mappingsFilePath)) {
            return {};
        }
        const content = readFileSync(mappingsFilePath, "utf8");
        if (!content.trim()) {
            return {};
        }
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            return parsed as Record<string, string>;
        }
        logger.error(
            `File mappings file <${mappingsFilePath}> does not contain a valid JSON object, ignoring it.`,
        );
        return {};
    } catch (err) {
        logger.error(
            `Failed to load file mappings from <${mappingsFilePath}>! Details: <${err}>.`,
        );
        return {};
    }
}

/**
 * Persists the file mappings JSON into the user data folder.
 * @param userDataPath path of the user data folder
 * @param mappings record of asset ID -> resolved file path
 * @returns `void` on success, `Error` otherwise
 */
export async function saveFileMappings(
    userDataPath: string,
    mappings: Record<string, string>,
): Promise<void | Error> {
    const contentBuffer = new TextEncoder().encode(JSON.stringify(mappings, null, 2));
    return await saveFile(
        path.join(userDataPath, "Processing", FILE_MAPPINGS_FILENAME),
        contentBuffer.buffer as ArrayBuffer,
    );
}

/**
 * Resolves the path a managed asset refers to. Files smaller than the threshold are copied
 * into `Processing/Files` inside the user data folder and the copy path is returned, bigger
 * files are referenced by their original path.
 * @param userDataPath path of the user data folder
 * @param assetId ID of the managed asset the path is resolved for
 * @param originalFilePath absolute path of the originally loaded file
 * @returns resolved absolute path the asset should be referenced by, or `Error`
 */
export async function resolveAndStoreFileMapping(
    userDataPath: string,
    assetId: AssetId,
    originalFilePath: string,
): Promise<string | Error> {
    try {
        const stats = await stat(originalFilePath);
        const isSmallFile = stats.size < FILE_COPY_SIZE_THRESHOLD;

        let resolvedPath = originalFilePath;
        if (isSmallFile) {
            const filesDirectory = path.join(userDataPath, "Processing", "Files");
            resolvedPath = path.join(
                filesDirectory,
                `${assetId}${path.extname(originalFilePath)}`,
            );

            // Copy the original file into `Processing/Files` named by the asset ID.
            await mkdir(filesDirectory, { recursive: true });
            await copyFile(originalFilePath, resolvedPath);
        }

        const mappings = loadFileMappings(userDataPath);
        mappings[assetId] = resolvedPath;

        const saveResult = await saveFileMappings(userDataPath, mappings);
        if (saveResult instanceof Error) {
            return saveResult;
        }

        return resolvedPath;
    } catch (err) {
        logger.error(
            `Failed to resolve file mapping for asset <${assetId}>! Details: <${err}>.`,
        );
        return new Error(
            `Failed to resolve file mapping for asset <${assetId}>! Details: <${
                (err as Error).message
            }>.`,
        );
    }
}

/**
 * Stores the data of a managed asset (e.g. extracted from an MVSX archive) as a file
 * inside `Processing/Files` and adds the mapping. Used when there is no original
 * file on disk, unlike `resolveAndStoreFileMapping`.
 * @param userDataPath path of the user data folder
 * @param assetId ID of the managed asset
 * @param data content of the asset
 * @param extension extension of the asset without dot, e.g. "mrc" (may be empty)
 * @returns resolved absolute path the asset is stored under, or `Error`
 */
export async function storeFileMappingFromData(
    userDataPath: string,
    assetId: AssetId,
    data: ArrayBuffer,
    extension: string,
): Promise<string | Error> {
    try {
        const filesDirectory = path.join(userDataPath, "Processing", "Files");
        const ext = extension && extension !== "unknown" ? `.${extension}` : "";
        const resolvedPath = path.join(filesDirectory, `${assetId}${ext}`);

        // Write the asset data into `Processing/Files` named by the asset ID.
        await mkdir(filesDirectory, { recursive: true });
        const writeResult = await saveFile(resolvedPath, data);
        if (writeResult instanceof Error) {
            return writeResult;
        }

        const mappings = loadFileMappings(userDataPath);
        mappings[assetId] = resolvedPath;

        const saveResult = await saveFileMappings(userDataPath, mappings);
        if (saveResult instanceof Error) {
            return saveResult;
        }

        return resolvedPath;
    } catch (err) {
        logger.error(
            `Failed to store file mapping for asset <${assetId}>! Details: <${err}>.`,
        );
        return new Error(
            `Failed to store file mapping for asset <${assetId}>! Details: <${
                (err as Error).message
            }>.`,
        );
    }
}

/**
 * Removes a single mapping from the file mappings JSON.
 * @param userDataPath path of the user data folder
 * @param assetId ID of the managed asset to remove from mappings
 * @returns `void` on success, `Error` otherwise
 */
export async function removeFileMapping(
    userDataPath: string,
    assetId: AssetId,
): Promise<void | Error> {
    try {
        const mappings = loadFileMappings(userDataPath);
        if (!(assetId in mappings)) {
            return;
        }

        delete mappings[assetId];
        return await saveFileMappings(userDataPath, mappings);
    } catch (err) {
        logger.error(
            `Failed to remove file mapping for asset <${assetId}>! Details: <${err}>.`,
        );
        return new Error(
            `Failed to remove file mapping for asset <${assetId}>! Details: <${
                (err as Error).message
            }>.`,
        );
    }
}
