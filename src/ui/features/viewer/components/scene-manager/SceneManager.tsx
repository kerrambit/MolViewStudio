import { useState } from "react";
import { Text } from "@mantine/core";
import { SegmentedController } from "../../../../components/common/segmented-controller/SegmentedController";
import { Sidebar } from "../../../../components/common/sidebar/Sidebar";
import { StoryOptions } from "./story-options/StoryOptions";
import { Assets } from "./assets-sidebar/Assets";
import { Views } from "./views-sidebar/Views";
import { ViewBuilder } from "./view-builder-sidebar/ViewBuilder";
import { UiLocalStorageService } from "../../../../services/UiLocalStorageService";
import { useRegimeStore } from "../../../../stores/regimeStore";

interface SceneManagerProps {
    isMolstarExpanded: boolean;
    isMolstarLoading: boolean;
}

export function SceneManager(props: SceneManagerProps) {
    // Use regime.
    const regime = useRegimeStore((state) => state.regime);

    // Main sidebar state.
    type TabType = "storyOptions" | "assets" | "views";
    const [tab, setTab] = useState<TabType>(
        UiLocalStorageService.SceneManager.getTab(),
    );

    // Builder sidebar state.
    const [isBuilderOpen, setIsBuilderOpen] = useState<string | undefined>(
        UiLocalStorageService.SceneManager.getBuilderSidebar(),
    );

    // const history = useMemo(() => {
    //     if (regime.kind === "viewing") {
    //         return regime.history;
    //     }
    // }, [regime]);

    // When in `idling` regime, do not render anything.
    if (regime.kind === "idling") {
        return null;
    }

    // Render the component.
    return (
        <>
            <Sidebar
                style={{
                    gap: ".5em",
                    padding: ".5em",
                }}
            >
                <Text size="xl" fw={520}>
                    Scene Manager
                </Text>

                {/* <Text>History: {history?.toString()}</Text> */}

                {/* Fix: segmented controller component was visible in Molstar Full-Screen, that is why we check if molstar is expanded. */}
                {!props.isMolstarExpanded && (
                    <SegmentedController<TabType>
                        value={tab}
                        onChange={(tab) => {
                            setTab(tab);
                            UiLocalStorageService.SceneManager.setTab(tab);
                        }}
                        data={[
                            { label: "Story Options", value: "storyOptions" },
                            { label: "Assets", value: "assets" },
                            { label: "Views", value: "views" },
                        ]}
                        widthWrapOrientationLimit={292}
                    />
                )}

                {tab === "storyOptions" && regime.kind === "viewing" && (
                    <StoryOptions></StoryOptions>
                )}

                {tab === "assets" && regime.kind === "viewing" && (
                    <Assets></Assets>
                )}

                {tab === "views" && regime.kind === "viewing" && (
                    <Views
                        isMolstarLoading={props.isMolstarLoading}
                        onOpenBuilder={(key) => {
                            setIsBuilderOpen(key);
                            UiLocalStorageService.SceneManager.setBuilderSidebar(
                                key,
                            );
                        }}
                        isBuilderOpen={!!isBuilderOpen}
                    ></Views>
                )}
            </Sidebar>

            {regime.kind === "viewing" && tab === "views" && isBuilderOpen && (
                <Sidebar>
                    <ViewBuilder
                        key={isBuilderOpen}
                        viewKey={isBuilderOpen}
                        onClose={() => {
                            setIsBuilderOpen(undefined);
                            UiLocalStorageService.SceneManager.setBuilderSidebar(
                                undefined,
                            );
                        }}
                    ></ViewBuilder>
                </Sidebar>
            )}
        </>
    );
}
