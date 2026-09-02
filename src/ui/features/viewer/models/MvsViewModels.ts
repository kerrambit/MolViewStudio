/**
 * Selector for a component: a keyword, a single expression, or a list of
 * expressions. Kept permissive/simple since the view model only manages one
 * default component per structure asset.
 */
export type PredefinedSelector =
    | "all"
    | "polymer"
    | "protein"
    | "nucleic"
    | "branched"
    | "ligand"
    | "ion"
    | "water"
    | "coarse";

export interface SelectorExpression {
    label_entity_id?: string;
    label_asym_id?: string;
    auth_asym_id?: string;
    label_seq_id?: number;
    auth_seq_id?: number;
    label_comp_id?: string;
    auth_comp_id?: string;
    label_atom_id?: string;
    auth_atom_id?: string;
    type_symbol?: string;
}

export type Selector =
    | PredefinedSelector
    | SelectorExpression
    | SelectorExpression[];

/**
 * A single component within a structure: its selection, how it's rendered,
 * its color/opacity, and its own optional camera focus. Flat, like
 * VolumeViewModel and the old single-component StructureViewModel, so a
 * per-component update hook can still do a simple `keyof ComponentEntry` set.
 *
 * `id` is a UI-only identifier (never written into the MVS tree — MVS has no
 * native concept of component identity). It exists purely so your app can
 * target "update this specific component" in the `components` array and use
 * it as a React key.
 */
export interface ComponentEntry {
    id: string;

    selector: Selector;

    representationType:
        | "cartoon"
        | "backbone"
        | "ball_and_stick"
        | "line"
        | "spacefill"
        | "carbohydrate"
        | "surface"
        | "putty";
    size_factor: number;
    ignore_hydrogens: boolean; // ball_and_stick / line / spacefill / surface
    tubular_helices: boolean; // cartoon only
    surface_type: "molecular" | "gaussian"; // surface only
    size_theme: "uniform" | "uncertainty"; // putty only

    color: string;
    opacity: number;

    show_focus: boolean;
    focus_direction: [number, number, number];
    focus_up: [number, number, number];

    // transform node — per-component, since each component can be
    // independently positioned (MVS allows `transform` under `component`).
    translationX: number;
    translationY: number;
    translationZ: number;
    rotationX: number; // Pitch (Degrees)
    rotationY: number; // Yaw (Degrees)
    rotationZ: number; // Roll (Degrees)
}

/** Generates a UI-only component id. Swap for your app's id scheme if you have one. */
function generateComponentId(): string {
    return typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `component-${Math.random().toString(36).slice(2)}`;
}

export function createDefaultComponentEntry(
    id: string = generateComponentId(),
): ComponentEntry {
    return {
        id,
        selector: "all",
        representationType: "cartoon",
        size_factor: 1,
        ignore_hydrogens: false,
        tubular_helices: false,
        surface_type: "molecular",
        size_theme: "uniform",
        color: "#ffffff",
        opacity: 1.0,
        show_focus: false,
        focus_direction: [0, 0, -1],
        focus_up: [0, 1, 0],
        translationX: 0,
        translationY: 0,
        translationZ: 0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
    };
}

/**
 * The unified View-Model for structure parameters. Top-level fields (the
 * `structure` node) stay flat and singular — there's still exactly one
 * `structure` node per asset branch, so they work with a generic
 * `updateStructureViewModel(assetId, paramKey: keyof StructureViewModel, val)` hook.
 * Transform (translation/rotation) and focus are NOT top-level: MVS allows
 * `transform` under either `structure` or `component`, and `focus` only under
 * `component` (not `structure`) — so both live on each `ComponentEntry`,
 * updated via a separate `updateStructureComponentViewModel(assetId, componentId, paramKey, val)`
 * hook that maps over the array (see structure-molstar-sync.ts).
 */
export interface StructureViewModel {
    // --- structure node ---
    format: string; // "mmcif" | "bcif" | "pdb" | ...
    type: "model" | "assembly" | "symmetry" | "symmetry_mates";
    block_header: string | null;
    block_index: number;
    model_index: number;
    coordinates_ref: string | null;
    assembly_id: string | null; // only applied when type === "assembly"
    radius: number; // only applied when type === "symmetry_mates"
    ijk_min: [number, number, number]; // only applied when type === "symmetry"
    ijk_max: [number, number, number]; // only applied when type === "symmetry"

    // --- zero or more independently-styled, independently-positioned components ---
    components: ComponentEntry[];
}

export const DEFAULT_STRUCTURE_VIEW_MODEL: StructureViewModel = {
    format: "N/A",
    type: "model",
    block_header: null,
    block_index: 0,
    model_index: 0,
    coordinates_ref: null,
    assembly_id: null,
    radius: 5,
    ijk_min: [-1, -1, -1],
    ijk_max: [1, 1, 1],

    components: [createDefaultComponentEntry("component-default")],
};

/**
 * The unified flat View-Model for volume parameters.
 */
export interface VolumeViewModel {
    format: string;
    type: string;
    relative_isovalue: number;
    show_wireframe: boolean;
    show_faces: boolean;
    color: string;
    opacity: number;
    translationX: number;
    translationY: number;
    translationZ: number;
    rotationX: number; // Pitch (Degrees)
    rotationY: number; // Yaw (Degrees)
    rotationZ: number; // Roll (Degrees)
}

/**
 * Default volume view model.
 */
export const DEFAULT_VOLUME_VIEW_MODEL: VolumeViewModel = {
    format: "N/A",
    type: "isosurface",
    relative_isovalue: 1.0,
    show_wireframe: false,
    show_faces: true,
    color: "#ffffff",
    opacity: 1.0,
    translationX: 0,
    translationY: 0,
    translationZ: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
};
