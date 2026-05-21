import path from "path";
import { readFileSync } from "fs";
import { writeFile, mkdir } from "fs/promises";
import { logger } from "./logger.js";

export function readFiles(filePaths: string[]): FileData[] | Error {
    const collectedFileData: FileData[] = [];

    for (const filePath of filePaths) {
        try {
            const fileName = path.basename(filePath);
            const fileExtension = path.extname(filePath).toLowerCase().slice(1);
            const isBinary = ["mvsx", "cvsx", "bcif", "map"].includes(
                fileExtension,
            );

            const fileContent = isBinary
                ? new Uint8Array(readFileSync(filePath))
                : readFileSync(filePath, "utf8");

            collectedFileData.push({
                path: filePath,
                extension: fileExtension,
                name: fileName,
                binary: isBinary,
                content: fileContent,
            });
        } catch (err) {
            return new Error(
                `While reading file <${filePath}>, an error occurred: <${err}>!`,
            );
        }
    }

    return collectedFileData;
}

export async function saveFile(fullFilePath: string, data: ArrayBuffer) {
    const directoryPath = path.dirname(fullFilePath);

    logger.info(`Received data for saving to path <${fullFilePath}>.`);

    try {
        await mkdir(directoryPath, { recursive: true });

        const arrayBuffer = data;
        const buffer = Buffer.from(arrayBuffer);

        await writeFile(fullFilePath, buffer);

        logger.info(`Successfully saved file to <${fullFilePath}>.`);
        return;
    } catch (error) {
        logger.error(
            `Failed to save file <${fullFilePath}>! Details: <${
                (error as Error).message
            }>.`,
            error,
        );
        return new Error(
            `Failed to save file <${fullFilePath}>! Details: <${
                (error as Error).message
            }>.`,
        );
    }
}
