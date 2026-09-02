/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

export type RenderStrategy = "volume" | "structure" | "both";
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

export function getAssetConfig(extension: string): AssetDefinition | null {
    return SUPPORTED_ASSETS[extension] || null;
}

export function isExtensionSupported(extension: string): boolean {
    return (SUPPORTED_ASSETS[extension] || null) !== null;
}

export function checkRequiresProcessing(extension: string): boolean {
    const config = getAssetConfig(extension);
    return config ? config.requiresProcessing : false;
}

export function checkOffersProcessing(extension: string): boolean {
    const config = getAssetConfig(extension);
    return config ? config.offersProcessing : false;
}

export function getRenderStrategy(extension: string): RenderStrategy {
    const config = getAssetConfig(extension);
    return config?.renderStrategy ?? "structure";
}

export function getParser(extension: string): ParserType | undefined {
    const config = getAssetConfig(extension);
    return config?.parser;
}

export function getPrioritizedRenderStrategy(extension: string) {
    const config = getAssetConfig(extension);

    if (config) {
        if (config.renderStrategy === "both") {
            return "structure";
        }
        return config.renderStrategy;
    }

    return "structure";
}

export function getAllParserTypes(): string[] {
    return ["map", "bcif", "mmcif"];
}

export function getAllExtensions(): string[] {
    return ["map", "cif", "bcif", "ccp4", "mrc"];
}
