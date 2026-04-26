import { useState } from "react";
import { SegmentedController } from "../common/segmented-controller/SegmentedController";
import { Sidebar } from "../common/sidebar/Sidebar";
import { useRegime } from "../../services/RegimeProvider";
import { StoryOptions } from "./story-options/StoryOptions";
import { Assets } from "./assets-sidebar/Assets";
import { Views } from "./views-sidebar/Views";
import { ViewBuilder } from "./view-builder-sidebar/ViewBuilder";

interface SceneManagerProps {
    isMolstarExpanded: boolean;
    isMolstarLoading: boolean;
}

export function SceneManager(props: SceneManagerProps) {
    // Regime.
    const { regime } = useRegime();

    // Main sidebar state.
    type SidebarType = "storyOptions" | "assets" | "views";
    const [sidebar, setSidebar] = useState<SidebarType>("storyOptions");

    // Builder sidebar state.
    const [isBuilderOpen, setIsBuilderOpen] = useState<string | undefined>(
        undefined,
    );

    // Render component.
    return (
        <>
            <Sidebar
                style={{
                    gap: ".5em",
                    padding: ".5em",
                }}
            >
                {/* Fix: segmented controller component was visible in Molstar Full-Screen, that is why we check if molstar is expanded. */}
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
                    <StoryOptions></StoryOptions>
                )}

                {sidebar === "assets" && regime.kind === "viewing" && (
                    <Assets></Assets>
                )}

                {sidebar === "views" && regime.kind === "viewing" && (
                    <Views
                        isMolstarLoading={props.isMolstarLoading}
                        onOpenBuilder={(key) => setIsBuilderOpen(key)}
                    ></Views>
                )}
            </Sidebar>

            {isBuilderOpen && (
                <Sidebar>
                    <ViewBuilder
                        viewKey={isBuilderOpen}
                        onClose={() => setIsBuilderOpen(undefined)}
                    ></ViewBuilder>
                </Sidebar>
            )}
        </>
    );
}
