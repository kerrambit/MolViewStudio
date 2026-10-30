/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

export function getFilenameFromPath(path: string) {
    return path.split("/").pop() ?? path;
}

export function getExtensionFromFileName(filename: string | undefined) {
    if (!filename) return undefined;
    return filename.split(".").pop() ?? "";
}

export function getExtensionFromUrl(url: string): string | undefined {
    try {
        const pathname = new URL(url).pathname;
        const extension = pathname.split(".").pop();
        return extension ?? undefined;
    } catch {
        return undefined;
    }
}

export function getFilenameWithoutExtension(filename: string | undefined) {
    if (!filename) return undefined;
    const splitted = filename.split(".");
    return splitted.at(0);
}

export function getFilePathWithoutFile(filepath: string): string {
    const lastSlashIndex = filepath.lastIndexOf("/");
    if (lastSlashIndex === -1) return "";

    return filepath.substring(0, lastSlashIndex);
}

export function addExtensionToFilename(filename: string, extension: string) {
    return `${filename}.${extension}`;
}

/**
 * Computes the size of the file content in bytes.
 * @param file file data
 * @returns size in bytes
 */
export function getFileSizeInBytes(file: FileData): number {
    return typeof file.content === "string"
        ? file.content.length
        : file.content.byteLength;
}

export function replaceExtension(filename: string | undefined, newExtension: string) {
    if (!filename) return undefined;

    const lastDotIndex = filename.lastIndexOf(".");

    if (lastDotIndex <= 0) {
        return `${filename}.${newExtension}`;
    }

    return `${filename.substring(0, lastDotIndex)}.${newExtension}`;
}

/**
 * Replaces the extension of a file path, keeping the directory and file name as they are.
 * Works with both "/" and "\" separators. If the file has no extension, the new one is appended.
 *
 * @example
 * replaceFileExtension("relative path\\filename.mrc", "zip"); // "relative path\\filename.zip"
 * replaceFileExtension("assets/maps/file.tar.gz", ".bin");    // "assets/maps/file.tar.bin"
 */
export function replaceFileExtension(filepath: string, newExtension: string): string {
    const extension = newExtension.replace(/^\./, "");

    const lastSeparatorIndex = Math.max(
        filepath.lastIndexOf("/"),
        filepath.lastIndexOf("\\"),
    );
    const lastDotIndex = filepath.lastIndexOf(".");

    // A dot counts as an extension only if it is in the file name (after the last separator)
    // and is not the first character of it (so ".gitignore" is treated as having no extension).
    const hasExtension = lastDotIndex > lastSeparatorIndex + 1;
    const base = hasExtension ? filepath.substring(0, lastDotIndex) : filepath;

    return extension ? `${base}.${extension}` : base;
}
