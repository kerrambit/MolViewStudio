export function getFilenameFromPath(path: string) {
    return path.split("/").pop() ?? path;
}

export function getExtensionFromFileName(filename: string | undefined) {
    if (!filename) return undefined;
    return filename.split(".").pop() ?? "";
}
