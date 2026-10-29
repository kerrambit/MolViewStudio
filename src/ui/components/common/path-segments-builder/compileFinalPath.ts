/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

/**
 * Function to compile final path from individual segments.
 * @param pathSegments path segments array
 * @returns string of compiled final path
 */
export const compileFinalPath = (pathSegments: string[]) => {
    const validFolders = pathSegments.filter((seg) => seg.trim() !== "");
    const folderPath = validFolders.join("/");
    return folderPath ? `${folderPath}/` : "";
};
