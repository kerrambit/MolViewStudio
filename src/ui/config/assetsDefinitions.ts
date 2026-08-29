/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

export type RenderStrategy = "volume" | "structure" | "both" | "unsupported";
export type ParserType = "map" | "bcif" | "mmcif"; // export type ParseFormatT = 'mmcif' | 'bcif' | 'pdb' | 'pdbqt' | 'gro' | 'xyz' | 'mol' | 'sdf' | 'mol2' | 'lammpstrj' | 'xtc' | 'nctraj' | 'dcd' | 'trr' | 'psf' | 'prmtop' | 'top' | 'map' | 'dx' | 'dxbin';
export type ExtensionType = "map" | "cif" | "bcif" | "ccp4" | "mrc";

export interface AssetDefinition {
    extension: string;
    renderStrategy: RenderStrategy;
    parser: ParserType;
    isBinary: boolean;
    description: string;
    requiresProcessing: boolean;
    offersProcessing: boolean;
}

const SUPPORTED_ASSETS: Record<string, AssetDefinition> = {
    map: {
        extension: "map",
        renderStrategy: "volume",
        parser: "map",
        isBinary: true,
        description: "Volumetric Electron Density Map",
        requiresProcessing: false,
        offersProcessing: true,
    },
    cif: {
        extension: "cif",
        renderStrategy: "structure",
        parser: "mmcif",
        isBinary: false,
        description: "CIF Structure",
        requiresProcessing: false,
        offersProcessing: false,
    },
    bcif: {
        extension: "bcif",
        renderStrategy: "both",
        parser: "bcif",
        isBinary: true,
        description: "Binary CIF Structure",
        requiresProcessing: false,
        offersProcessing: false,
    },
    ccp4: {
        extension: "ccp4",
        renderStrategy: "volume",
        parser: "map",
        isBinary: true,
        description: "Electron Density File",
        requiresProcessing: false,
        offersProcessing: false,
    },
    mrc: {
        extension: "mrc",
        renderStrategy: "volume",
        parser: "map",
        isBinary: true,
        description: "3D Electron Density File or 2D Image File",
        requiresProcessing: false,
        offersProcessing: false,
    },
};

export function getAllSupportedAssets() {
    return SUPPORTED_ASSETS;
}

export function getAllSupportedAssetsParsers(): Record<string, string> {
    return Object.fromEntries(
        Object.entries(SUPPORTED_ASSETS).map(([key, asset]) => [
            key,
            asset.parser,
        ]),
    );
}

export function getAssetConfig(filename: string): AssetDefinition | null {
    const extension = filename.split(".").pop()?.toLowerCase() || "";
    return SUPPORTED_ASSETS[extension] || null;
}

export function getAssetConfigBasedOnExtension(
    extension: string,
): AssetDefinition | null {
    return SUPPORTED_ASSETS[extension] || null;
}

export function isAssetSupported(filename: string): boolean {
    return getAssetConfig(filename) !== null;
}

export function isExtensionSupported(extension: string): boolean {
    return (SUPPORTED_ASSETS[extension] || null) !== null;
}

export function checkRequiresProcessing(filename: string): boolean {
    const config = getAssetConfig(filename);
    return config ? config.requiresProcessing : false;
}

export function checkOffersProcessing(filename: string): boolean {
    const config = getAssetConfig(filename);
    return config ? config.offersProcessing : false;
}

export function getAllParserTypes(): string[] {
    return ["map", "bcif", "mmcif"];
}

export function getAllExtensions(): string[] {
    return ["map", "cif", "bcif", "ccp4", "mrc"];
}
