export function getFilenameFromPath(path: string) {
    return path.split("/").pop() ?? path;
}

export function getExtensionFromFileName(filename: string | undefined) {
    if (!filename) return undefined;
    return filename.split(".").pop() ?? "";
}

export function getFilenameWithoutExtension(filename: string | undefined) {
    if (!filename) return undefined;
    const splitted = filename.split(".");
    return splitted.at(0);
}

export function addExtensionToFilename(filename: string, extension: string) {
    return `${filename}.${extension}`;
}
