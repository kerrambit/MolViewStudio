/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
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
