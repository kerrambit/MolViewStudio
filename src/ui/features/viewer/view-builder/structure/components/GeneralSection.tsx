/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useState } from "react";
import { Select } from "@mantine/core";
import { getAllParserTypes } from "../../../../assets/domain/assetsDefinitions";
import { UiLocalStorageService } from "../../../../persistence/services/UiLocalStorageService";
import { SectionGroup } from "../../components/SectionGroup";
import { AdvancedGeneralSection } from "./AdvancedGeneralSection";

import type {
    UpdateViewModelFields,
    UpdateViewModelParam,
} from "../domain/structureTabTypesAndConstants";
import type { StructureViewModel } from "../../domain/MvsViewModels";
import { CollapsibleSection } from "../../components/CollapsibleSection";
import { GlobalTooltipsAndLabelsSection } from "./GlobalTooltipsAndLabelsSection";
import { GlobalTransformSection } from "./GlobalTransformSection";

type GeneralSectionProps = {
    viewKey: string;
    asset: ManagedAsset;
    viewModel: StructureViewModel;
    onUpdateParam: UpdateViewModelParam;
    onUpdateFields: UpdateViewModelFields;
};

/**
 * The "General" section of the structure tab: format/type selectors plus the advanced options, which in turn hold global tooltips & labels and transform.
 */
export function GeneralSection({
    viewKey,
    asset,
    viewModel,
    onUpdateParam,
    onUpdateFields,
}: GeneralSectionProps) {
    const [generalSectionExpanded, setGeneralSectionExpanded] = useState(
        UiLocalStorageService.ViewBuilder.getExpandedStructureGeneralSection(
            asset.id,
            viewKey,
        ),
    );

    const [advancedGeneralSectionExpanded, setAdvancedGeneralSectionExpanded] = useState(
        UiLocalStorageService.ViewBuilder.getExpandedStructureAdvancedGeneralSection(
            asset.id,
            viewKey,
        ),
    );

    const [tooltipsAndLabelsSectionExpanded, setTooltipsAndLabelsSectionExpanded] =
        useState(() =>
            UiLocalStorageService.ViewBuilder.getExpandedStructureTooltipsAndLabelsSection(
                asset.id,
                viewKey,
            ),
        );

    const [transformSectionExpanded, setTransformSectionExpanded] = useState(() =>
        UiLocalStorageService.ViewBuilder.getExpandedStructureTransformSection(
            asset.id,
            viewKey,
        ),
    );

    // Render the component.
    return (
        <CollapsibleSection
            title="General"
            titleTextSize="md"
            expanded={generalSectionExpanded}
            onToggle={() =>
                setGeneralSectionExpanded((prev) => {
                    const nextState = !prev;
                    UiLocalStorageService.ViewBuilder.setExpandedStructureGeneralSection(
                        asset.id,
                        viewKey,
                        nextState,
                    );
                    return nextState;
                })
            }
        >
            <SectionGroup>
                <Select
                    label="Format"
                    disabled
                    data={getAllParserTypes()}
                    value={viewModel.format}
                    placeholder="N/A"
                    size="xs"
                />

                <Select
                    label="Type"
                    data={["model", "assembly", "symmetry", "symmetry_mates"]}
                    value={viewModel.type}
                    onChange={(val) => {
                        if (val) onUpdateParam("type", val, true);
                    }}
                    size="xs"
                />

                <CollapsibleSection
                    title="Advanced options"
                    titleTextSize="sm"
                    expanded={advancedGeneralSectionExpanded}
                    onToggle={() =>
                        setAdvancedGeneralSectionExpanded((prev) => {
                            const nextState = !prev;
                            UiLocalStorageService.ViewBuilder.setExpandedStructureAdvancedGeneralSection(
                                asset.id,
                                viewKey,
                                nextState,
                            );
                            return nextState;
                        })
                    }
                >
                    <SectionGroup divider={false}>
                        <AdvancedGeneralSection
                            viewModel={viewModel}
                            onUpdateParam={onUpdateParam}
                        />

                        <CollapsibleSection
                            title="Global Tooltips & Labels"
                            titleTextSize="md"
                            expanded={tooltipsAndLabelsSectionExpanded}
                            onToggle={() =>
                                setTooltipsAndLabelsSectionExpanded((prev) => {
                                    const nextState = !prev;
                                    UiLocalStorageService.ViewBuilder.setExpandedStructureTooltipsAndLabelsSection(
                                        asset.id,
                                        viewKey,
                                        nextState,
                                    );
                                    return nextState;
                                })
                            }
                        >
                            <GlobalTooltipsAndLabelsSection
                                viewModel={viewModel}
                                onUpdateParam={onUpdateParam}
                                onUpdateFields={onUpdateFields}
                            />
                        </CollapsibleSection>

                        <CollapsibleSection
                            title="Global Transform"
                            titleTextSize="md"
                            expanded={transformSectionExpanded}
                            onToggle={() =>
                                setTransformSectionExpanded((prev) => {
                                    const nextState = !prev;
                                    UiLocalStorageService.ViewBuilder.setExpandedStructureTransformSection(
                                        asset.id,
                                        viewKey,
                                        nextState,
                                    );
                                    return nextState;
                                })
                            }
                        >
                            <GlobalTransformSection
                                viewModel={viewModel}
                                onUpdateParam={onUpdateParam}
                            />
                        </CollapsibleSection>
                    </SectionGroup>
                </CollapsibleSection>
            </SectionGroup>
        </CollapsibleSection>
    );
}
