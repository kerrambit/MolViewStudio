import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { logger } from "./logger.js";

/**
 * Loads .json file with an array of recent files.
 * @param userDataPath user data path
 * @param recentFilesPath file path to the .json file
 * @returns recent file paths
 */
export function loadRecentFiles(
    userDataPath: string,
    recentFilesPath: string,
): string[] {
    try {
        if (!existsSync(userDataPath)) {
            mkdirSync(userDataPath, { recursive: true });
        }

        if (existsSync(recentFilesPath)) {
            const content = readFileSync(recentFilesPath, "utf-8");
            return JSON.parse(content) as string[];
        }

        writeFileSync(recentFilesPath, JSON.stringify([], null, 2), "utf-8");
        return [];
    } catch (err) {
        logger.warn(`Failed to load recent files! Details: <${err}>.`);
        return [];
    }
}

/**
 * Writes recent file paths array into a file.
 * @param userDataPath user data path
 * @param recentFilesPath file path to the .json file
 * @param paths paths to write
 */
export function writeRecentFiles(
    userDataPath: string,
    recentFilesPath: string,
    paths: string[],
) {
    try {
        if (!existsSync(userDataPath)) {
            mkdirSync(userDataPath, { recursive: true });
        }
        writeFileSync(recentFilesPath, JSON.stringify(paths, null, 2), "utf-8");
    } catch (err) {
        logger.error(`Failed to write recent files! Details: <${err}>.`);
    }
}
