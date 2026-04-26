import { useState } from "react";
import { SegmentedController } from "../common/segmented-controller/SegmentedController";
import { Sidebar } from "../common/sidebar/Sidebar";
import { useRegime } from "../../services/RegimeProvider";
import { StoryOptions } from "./story-options/StoryOptions";
import { Assets } from "./assets-sidebar/Assets";
import { Views } from "./views-sidebar/Views";

interface SceneManagerProps {
    isMolstarExpanded: boolean;
    isMolstarLoading: boolean;
}

export function SceneManager(props: SceneManagerProps) {
    // Sidebar state.
    type SidebarType = "storyOptions" | "assets" | "views";
    const [sidebar, setSidebar] = useState<SidebarType>("storyOptions");

    // Regime.
    const { regime, setRegime } = useRegime();

    // Render component.
    return (
        <Sidebar
            style={{
                gap: ".5em",
                padding: ".5em",
            }}
        >
            {/* Fix: segmented controller was visible in Molstar Full-Screen, that is why we can if molstar is expanded. */}
            {!props.isMolstarExpanded && (
                <SegmentedController<SidebarType>
                    value={sidebar}
                    onChange={setSidebar}
                    data={[
                        { label: "Story Options", value: "storyOptions" },
                        { label: "Assets", value: "assets" },
                        { label: "Views", value: "views" },
                    ]}
                    widthWrapOrientationLimit={292}
                />
            )}

            {sidebar === "storyOptions" && regime.kind === "viewing" && (
                // TODO: we probably can save data directly in component, no need to prop drill and save it here
                <StoryOptions
                    title={regime.stateTree.metadata.title}
                    onTitleChange={(newTitle) => {
                        setRegime({
                            ...regime,
                            stateTree: {
                                ...regime.stateTree,
                                metadata: {
                                    ...regime.stateTree.metadata,
                                    title: newTitle,
                                },
                            },
                        });
                    }}
                    description={regime.stateTree.metadata.description}
                    onDescriptionChange={(newDescription) => {
                        setRegime({
                            ...regime,
                            stateTree: {
                                ...regime.stateTree,
                                metadata: {
                                    ...regime.stateTree.metadata,
                                    description: newDescription,
                                },
                            },
                        });
                    }}
                ></StoryOptions>
            )}

            {sidebar === "assets" && regime.kind === "viewing" && (
                <Assets></Assets>
            )}

            {sidebar === "views" && regime.kind === "viewing" && (
                <Views isMolstarLoading={props.isMolstarLoading}></Views>
            )}
        </Sidebar>
    );
}
