/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useState } from "react";
import { CollapseTrigger } from "../../../../../components/common/collapse-trigger/CollapseTriger";
import { UiLocalStorageService } from "../../../../../services/UiLocalStorageService";
import {
    Collapse,
    Divider,
    NumberInput,
    Scroller,
    Select,
    Tabs,
    TextInput,
} from "@mantine/core";
import { getAllParserTypes } from "../../../../../config/assetsDefinitions";
import {
    type ComponentEntry,
    type StructureViewModel,
} from "../../../models/MvsViewModels";
import { StructureTransformControls } from "./StructureTransformControls";
import { IJKControls } from "./IJKControls";

type StructureTabProps = {
    viewKey: string;
    asset: ManagedAsset;
    viewModel: StructureViewModel;
    onUpdateParam: (
        key: keyof StructureViewModel,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        val: any,
        sync: boolean,
    ) => void;
    onUpdateStructureComponentParam: (
        componentId: string,
        paramKey: keyof ComponentEntry,
        val: ComponentEntry[keyof ComponentEntry],
        syncToMolstar: boolean,
    ) => Promise<void>;
};

export function StructureTab({
    viewKey,
    asset,
    viewModel,
    onUpdateParam,
    onUpdateStructureComponentParam,
}: StructureTabProps) {
    const [currentComponentId, setCurrentComponentId] = useState<
        string | undefined
    >(
        viewModel.components.length > 0
            ? viewModel.components.at(0)?.id
            : undefined,
    );

    const currentComponent = viewModel.components.find(
        (component) => component.id === currentComponentId,
    );

    // Store expanded sections.
    const [generalSectionExpanded, setGeneralSectionExpanded] = useState(
        UiLocalStorageService.ViewBuilder.getExpandedStructureGeneralSection(
            asset.id,
            viewKey,
        ),
    );
    const [advancedGeneralSectionExpanded, setAdvancedGeneralSectionExpanded] =
        useState(
            UiLocalStorageService.ViewBuilder.getExpandedStructureAdvancedGeneralSection(
                asset.id,
                viewKey,
            ),
        );
    const [componentsSectionExpanded, setComponentsSectionExpanded] = useState(
        () => {
            if (!currentComponentId) {
                return true;
            }
            return UiLocalStorageService.ViewBuilder.getExpandedStructureComponentsSection(
                asset.id,
                viewKey,
                currentComponentId,
            );
        },
    );
    const [transformSectionExpanded, setTransformSectionExpanded] = useState(
        () => {
            if (!currentComponentId) {
                return false;
            }
            return UiLocalStorageService.ViewBuilder.getExpandedStructureTransformSection(
                asset.id,
                viewKey,
                currentComponentId,
            );
        },
    );

    // Render the component.
    return (
        <div>
            {/* General settings for Structure tab. */}
            <CollapseTrigger
                title={"General"}
                size={"md"}
                expanded={generalSectionExpanded}
                onClick={() => {
                    setGeneralSectionExpanded((prev) => {
                        const nextState = !prev;
                        UiLocalStorageService.ViewBuilder.setExpandedStructureGeneralSection(
                            asset.id,
                            viewKey,
                            nextState,
                        );
                        return nextState;
                    });
                }}
            ></CollapseTrigger>
            <Collapse expanded={generalSectionExpanded}>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1em",
                        paddingBottom: "1em",
                    }}
                >
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
                        data={[
                            "model",
                            "assembly",
                            "symmetry",
                            "symmetry_mates",
                        ]}
                        value={viewModel.type}
                        onChange={(val) => {
                            if (val) {
                                onUpdateParam("type", val, true);
                            }
                        }}
                        size="xs"
                    />

                    {/* Advanced general settings for Structure tab. */}
                    <CollapseTrigger
                        title={"Advanced options"}
                        size={"sm"}
                        expanded={advancedGeneralSectionExpanded}
                        onClick={() => {
                            setAdvancedGeneralSectionExpanded((prev) => {
                                const nextState = !prev;
                                UiLocalStorageService.ViewBuilder.setExpandedStructureAdvancedGeneralSection(
                                    asset.id,
                                    viewKey,
                                    nextState,
                                );
                                return nextState;
                            });
                        }}
                    ></CollapseTrigger>

                    <Collapse expanded={advancedGeneralSectionExpanded}>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.33em",
                                paddingBottom: "1em",
                            }}
                        >
                            <TextInput
                                label="Block header"
                                value={viewModel.block_header || undefined}
                                placeholder="null"
                                size="xs"
                                onChange={(val) =>
                                    typeof val === "string" &&
                                    onUpdateParam("block_header", val, false)
                                }
                                onBlur={() =>
                                    onUpdateParam(
                                        "block_header",
                                        viewModel.block_header,
                                        true,
                                    )
                                }
                                onKeyDown={(e) =>
                                    e.key === "Enter" &&
                                    onUpdateParam(
                                        "block_header",
                                        viewModel.block_header,
                                        true,
                                    )
                                }
                            ></TextInput>
                            <NumberInput
                                label="Block index"
                                value={viewModel.block_index}
                                size="xs"
                                onChange={(val) =>
                                    typeof val === "number" &&
                                    onUpdateParam("block_index", val, false)
                                }
                                onBlur={() =>
                                    onUpdateParam(
                                        "block_index",
                                        viewModel.block_index,
                                        true,
                                    )
                                }
                                onKeyDown={(e) =>
                                    e.key === "Enter" &&
                                    onUpdateParam(
                                        "block_index",
                                        viewModel.block_index,
                                        true,
                                    )
                                }
                            />
                            <NumberInput
                                label="Model index"
                                value={viewModel.model_index}
                                size="xs"
                                onChange={(val) =>
                                    typeof val === "number" &&
                                    onUpdateParam("model_index", val, false)
                                }
                                onBlur={() =>
                                    onUpdateParam(
                                        "model_index",
                                        viewModel.model_index,
                                        true,
                                    )
                                }
                                onKeyDown={(e) =>
                                    e.key === "Enter" &&
                                    onUpdateParam(
                                        "model_index",
                                        viewModel.model_index,
                                        true,
                                    )
                                }
                            />
                            <TextInput
                                label="Coordinates reference"
                                value={viewModel.coordinates_ref || undefined}
                                placeholder="null"
                                size="xs"
                                onChange={(val) =>
                                    typeof val === "string" &&
                                    onUpdateParam("coordinates_ref", val, false)
                                }
                                onBlur={() =>
                                    onUpdateParam(
                                        "coordinates_ref",
                                        viewModel.coordinates_ref,
                                        true,
                                    )
                                }
                                onKeyDown={(e) =>
                                    e.key === "Enter" &&
                                    onUpdateParam(
                                        "coordinates_ref",
                                        viewModel.coordinates_ref,
                                        true,
                                    )
                                }
                            ></TextInput>
                            {viewModel.type === "assembly" && (
                                <TextInput
                                    label="Assembly Id"
                                    value={viewModel.assembly_id || undefined}
                                    placeholder="null"
                                    size="xs"
                                    onChange={(val) =>
                                        typeof val === "string" &&
                                        onUpdateParam("assembly_id", val, false)
                                    }
                                    onBlur={() =>
                                        onUpdateParam(
                                            "assembly_id",
                                            viewModel.assembly_id,
                                            true,
                                        )
                                    }
                                    onKeyDown={(e) =>
                                        e.key === "Enter" &&
                                        onUpdateParam(
                                            "assembly_id",
                                            viewModel.assembly_id,
                                            true,
                                        )
                                    }
                                ></TextInput>
                            )}
                            {viewModel.type === "symmetry_mates" && (
                                <NumberInput
                                    label="Radius"
                                    value={viewModel.radius || undefined}
                                    size="xs"
                                    onChange={(val) =>
                                        typeof val === "number" &&
                                        onUpdateParam("radius", val, false)
                                    }
                                    onBlur={() =>
                                        onUpdateParam(
                                            "radius",
                                            viewModel.radius,
                                            true,
                                        )
                                    }
                                    onKeyDown={(e) =>
                                        e.key === "Enter" &&
                                        onUpdateParam(
                                            "radius",
                                            viewModel.radius,
                                            true,
                                        )
                                    }
                                ></NumberInput>
                            )}
                            {viewModel.type === "symmetry" && (
                                <IJKControls
                                    viewModel={viewModel}
                                    onUpdateParam={onUpdateParam}
                                ></IJKControls>
                            )}
                        </div>
                    </Collapse>

                    <Divider mb="md" />
                </div>
            </Collapse>

            {/* Components settings for Structure tab. */}
            <CollapseTrigger
                title={"Components"}
                size={"md"}
                expanded={componentsSectionExpanded}
                onClick={() => {
                    setComponentsSectionExpanded((prev) => {
                        const nextState = !prev;
                        UiLocalStorageService.ViewBuilder.setExpandedStructureComponentsSection(
                            asset.id,
                            viewKey,
                            currentComponentId!,
                            nextState,
                        );
                        return nextState;
                    });
                }}
            ></CollapseTrigger>

            <Collapse expanded={componentsSectionExpanded}>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1em",
                        paddingBottom: "1em",
                    }}
                >
                    <Tabs
                        onChange={(value) => {
                            if (value) setCurrentComponentId(value);
                        }}
                        defaultValue={currentComponentId}
                        style={{ marginTop: "0.5em" }}
                    >
                        <Tabs.List>
                            <Scroller>
                                {viewModel.components.map((component) => {
                                    return (
                                        <Tabs.Tab
                                            key={component.id}
                                            value={component.id}
                                        >
                                            {component.selector.toString()}
                                        </Tabs.Tab>
                                    );
                                })}
                            </Scroller>
                        </Tabs.List>
                    </Tabs>

                    {/* Transform settings for structure component tab. */}
                    <CollapseTrigger
                        title={"Transform"}
                        size={"md"}
                        expanded={transformSectionExpanded}
                        onClick={() => {
                            setTransformSectionExpanded((prev) => {
                                const nextState = !prev;
                                UiLocalStorageService.ViewBuilder.setExpandedStructureTransformSection(
                                    asset.id,
                                    viewKey,
                                    currentComponentId!,
                                    nextState,
                                );
                                return nextState;
                            });
                        }}
                    ></CollapseTrigger>
                    <Collapse expanded={transformSectionExpanded}>
                        <StructureTransformControls
                            component={currentComponent}
                            onUpdateStructureComponentParam={
                                onUpdateStructureComponentParam
                            }
                        ></StructureTransformControls>
                    </Collapse>
                </div>
            </Collapse>
        </div>
    );
}
