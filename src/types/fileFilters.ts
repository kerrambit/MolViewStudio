/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

export const AllFiles: FileFilter = { name: "All Files", extensions: ["*"] };

export const MVSFilters: FileFilter = {
    name: "MVS Files",
    extensions: ["mvsj", "mvsx"],
};

export const StructuralFilters: FileFilter = {
    name: "Structural Files",
    extensions: ["pdb"],
};

export const CVSXFilters: FileFilter = {
    name: "CVSX Files",
    extensions: ["cvsx"],
};

export const VolumeFilters: FileFilter = {
    name: "Volume Files",
    extensions: ["map"],
};
