/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import type { DownsamplingStrategy } from "../../processing/downsampling/domain/DownsamplingStrategy";
import type { ResolutionLevel } from "../../processing/resolution/domain/ResolutionLevel";

/**
 * Asset can be rendered using Molstar viewer in a view as `structure`, `volume`, or both.
 */
// TODO: move to better place
export type RenderStrategy = "volume" | "structure" | "both";

/**
 * Asset has to be parsed inside Molstar viewer using some existin parser.
 * See Molstar's type: `ParseFormatT = 'mmcif' | 'bcif' | 'pdb' | 'pdbqt' | 'gro' | 'xyz' | 'mol' | 'sdf' | 'mol2' | 'lammpstrj' | 'xtc' | 'nctraj' | 'dcd' | 'trr' | 'psf' | 'prmtop' | 'top' | 'map' | 'dx' | 'dxbin'`.
 */
// TODO: move to better place
export type ParserType = "map" | "bcif" | "mmcif";

/**
 * All supported extenions as a type.
 */
export type ExtensionType = "map" | "cif" | "mcif" | "mmcif" | "bcif" | "ccp4" | "mrc";

/**
 * Definition of an asset. It is not connected tightly with `ManagedAsset` type.
 * Usually, it is to use `AssetDefinition` functions to get additional information about given `ManagedAsset` object.
 */
export interface AssetDefinition {
    extension: string;
    renderStrategy: RenderStrategy;
    parser: ParserType;
    isBinary: boolean;
    description: string;
    requiresProcessing:
        | false
        | {
              downsamplingStrategy: DownsamplingStrategy;
          };
    offersProcessing:
        | false
        | {
              previewProcessing: {
                  downsamplingStrategy: DownsamplingStrategy;
                  resolution: ResolutionLevel;
              };
              exportProcessing: {
                  downsamplingStrategy: DownsamplingStrategy;
                  resolution: ResolutionLevel;
              };
          };
}

const SUPPORTED_ASSETS: Record<string, AssetDefinition> = {
    map: {
        extension: "map",
        renderStrategy: "volume",
        parser: "map",
        isBinary: true,
        description: "Volumetric Electron Density Map",
        requiresProcessing: false,
        offersProcessing: {
            previewProcessing: {
                downsamplingStrategy: "nearest",
                resolution: "low",
            },
            exportProcessing: {
                downsamplingStrategy: "nearest", // // TODO: until volsegtools crashed on non-nearest strategy, otherwise tricubic
                resolution: "high",
            },
        },
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
    mcif: {
        extension: "mcif",
        renderStrategy: "structure",
        parser: "mmcif",
        isBinary: false,
        description: "MCIF Structure",
        requiresProcessing: false,
        offersProcessing: false,
    },
    mmcif: {
        extension: "mmcif",
        renderStrategy: "structure",
        parser: "mmcif",
        isBinary: false,
        description: "MMCIF Structure",
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
        Object.entries(SUPPORTED_ASSETS).map(([key, asset]) => [key, asset.parser]),
    );
}

export function getAssetConfig(extension: string): AssetDefinition | null {
    return SUPPORTED_ASSETS[extension] || null;
}

export function isExtensionSupported(extension: string): boolean {
    return (SUPPORTED_ASSETS[extension] || null) !== null;
}

export function checkRequiresProcessing(
    extension: string,
): AssetDefinition["requiresProcessing"] {
    const config = getAssetConfig(extension);
    return config ? config.requiresProcessing : false;
}

export function checkOffersProcessing(
    extension: string,
): AssetDefinition["offersProcessing"] {
    const config = getAssetConfig(extension);
    return config ? config.offersProcessing : false;
}

export function getExtensionsOfferingProcessing(): string[] {
    return Object.values(SUPPORTED_ASSETS)
        .filter(
            (asset) =>
                asset.offersProcessing !== false || asset.requiresProcessing !== false,
        )
        .map((asset) => asset.extension);
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
    return ["map", "cif", "mcif", "mmcif", "bcif", "ccp4", "mrc"];
}
