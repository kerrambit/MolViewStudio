/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { SectionGroup } from "../../components/SectionGroup";
import type { StructureViewModel } from "../../domain/MvsViewModels";
import type {
    UpdateViewModelParam,
    UpdateComponentParam,
    UpdateViewModelFields,
    UpdateComponentFields,
} from "../domain/structureTabTypesAndConstants";
import { ComponentsSection } from "./ComponentsSection";
import { GeneralSection } from "./GeneralSection";

type StructureTabProps = {
    viewKey: string;
    asset: ManagedAsset;
    viewModel: StructureViewModel;
    onUpdateParam: UpdateViewModelParam;
    onUpdateStructureComponentParam: UpdateComponentParam;
    onUpdateFields: UpdateViewModelFields;
    onUpdateStructureComponentFields: UpdateComponentFields;
    onAddStructureComponent: () => Promise<string>;
    onDeleteStructureComponent: (componentId: string) => Promise<void>;
};

/**
 * The structure tab of the view builder sidebar, composed of the "General" and "Components" sections.
 */
export function StructureTab({
    viewKey,
    asset,
    viewModel,
    onUpdateParam,
    onUpdateStructureComponentParam,
    onUpdateFields,
    onUpdateStructureComponentFields,
    onAddStructureComponent,
    onDeleteStructureComponent,
}: StructureTabProps) {
    // Render the component.
    return (
        <SectionGroup divider={false}>
            <GeneralSection
                viewKey={viewKey}
                asset={asset}
                viewModel={viewModel}
                onUpdateParam={onUpdateParam}
                onUpdateFields={onUpdateFields}
            />

            <ComponentsSection
                viewKey={viewKey}
                asset={asset}
                components={viewModel.components}
                onUpdateStructureComponentParam={onUpdateStructureComponentParam}
                onUpdateStructureComponentFields={onUpdateStructureComponentFields}
                onAddStructureComponent={onAddStructureComponent}
                onDeleteStructureComponent={onDeleteStructureComponent}
            />
        </SectionGroup>
    );
}
