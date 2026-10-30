/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { Checkbox, NumberInput } from "@mantine/core";
import type { ComponentEntry } from "../../domain/MvsViewModels";
import { SectionGroup } from "../../components/SectionGroup";
import type { UpdateComponentParam } from "../domain/structureTabTypesAndConstants";
import { FocusControls } from "../../components/FocusControls";

type ComponentFocusSectionProps = {
    component?: ComponentEntry;
    activeComponentId?: string;
    onUpdateStructureComponentParam: UpdateComponentParam;
};

/**
 * Component focus subsection: focus toggle and direction/up controls.
 */
export function ComponentFocusSection({
    component,
    activeComponentId,
    onUpdateStructureComponentParam,
}: ComponentFocusSectionProps) {
    // Render the component.
    return (
        <SectionGroup>
            <Checkbox
                label="Show focus"
                size="xs"
                checked={component?.show_focus ?? false}
                onChange={(e) => {
                    if (activeComponentId)
                        onUpdateStructureComponentParam(
                            activeComponentId,
                            "show_focus",
                            e.currentTarget.checked,
                            true,
                        );
                }}
            />
            <FocusControls
                enable={component?.show_focus ?? false}
                component={component}
                onUpdateParam={onUpdateStructureComponentParam}
            />
            <NumberInput
                label="Radius factor"
                value={component?.radius_factor}
                step={0.1}
                min={0.0}
                size="xs"
                onChange={(val) =>
                    typeof val === "number" &&
                    activeComponentId &&
                    onUpdateStructureComponentParam(
                        activeComponentId,
                        "radius_factor",
                        val,
                        false,
                    )
                }
                onBlur={() =>
                    activeComponentId &&
                    component &&
                    onUpdateStructureComponentParam(
                        activeComponentId,
                        "radius_factor",
                        component.radius_factor,
                        true,
                    )
                }
                onKeyDown={(e) =>
                    e.key === "Enter" &&
                    activeComponentId &&
                    component &&
                    onUpdateStructureComponentParam(
                        activeComponentId,
                        "radius_factor",
                        component.radius_factor,
                        true,
                    )
                }
            />
        </SectionGroup>
    );
}
