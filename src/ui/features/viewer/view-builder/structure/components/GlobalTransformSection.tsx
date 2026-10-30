/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import type { StructureViewModel } from "../../domain/MvsViewModels";
import type { UpdateViewModelParam } from "../domain/structureTabTypesAndConstants";
import { StructureTransformControls } from "./StructureTransformControls";

type GlobalTransformSectionProps = {
    viewModel: StructureViewModel;
    onUpdateParam: UpdateViewModelParam;
};

/**
 * Global transform controls for the whole structure.
 */
export function GlobalTransformSection({
    viewModel,
    onUpdateParam,
}: GlobalTransformSectionProps) {
    return (
        <StructureTransformControls viewModel={viewModel} onUpdateParam={onUpdateParam} />
    );
}
