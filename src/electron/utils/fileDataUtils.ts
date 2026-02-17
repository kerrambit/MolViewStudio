import path from "path";
import { readFileSync } from "fs";

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
