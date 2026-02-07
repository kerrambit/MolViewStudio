import { useState } from "react";
import { SegmentedController } from "../common/segmented-controller/SegmentedController";
import { Sidebar } from "../common/sidebar/Sidebar";
import { Button } from "../common/button/Button";
import { ViewCard } from "../view-card/ViewCard";
import {
    addNewSnapshotToManager,
    applySnapshotByIndex,
    type View,
    type ViewMetadata,
} from "../../../molstar-wrapper/src";
import { NewViewCardCreator } from "../view-card/NewViewCardCreator";

interface SceneManagerProps {
    isMolstarExpanded: boolean;
    currentView: View;
    setCurrentView: React.Dispatch<React.SetStateAction<View>>;
    views: ViewMetadata[];
    setViews: React.Dispatch<React.SetStateAction<ViewMetadata[]>>;
}

export function SceneManager(props: SceneManagerProps) {
    // Sidebar state.
    type SidebarType = "views" | "seg" | "anno";
    const [sidebar, setSidebar] = useState<SidebarType>("views");

    const [activeViewCardIndex, setActiveViewCardIndex] = useState(0);

    const isStateTreeSingle = props.views.length === 0;

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
                        { label: "Views", value: "views" },
                        { label: "Segmentations", value: "seg" },
                        { label: "Annotations", value: "anno" },
                    ]}
                    widthWrapOrientationLimit={292}
                />
            )}

            {sidebar === "views" && (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75em",
                    }}
                >
                    <Button
                        size="small"
                        onClick={() => {
                            props.setViews(() => []);
                            // TODO: clear views in state tree
                        }}
                    >
                        {"Clear views"}
                    </Button>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "1em",
                        }}
                    >
                        {props.views.map((view, index) => (
                            <ViewCard
                                key={view.id}
                                active={index === activeViewCardIndex}
                                title={view.title || "New view..."}
                                index={index}
                                thumbnail={view.thumbnail}
                                onClick={async () => {
                                    await applySnapshotByIndex(index);
                                    setActiveViewCardIndex(index);
                                }}
                                onSave={(newTitle: string) => {
                                    props.setViews(
                                        (prevViews) =>
                                            prevViews.map((v) =>
                                                v.id === view.id
                                                    ? {
                                                          ...v,
                                                          title: newTitle,
                                                      }
                                                    : v,
                                            ),
                                        // TODO: reload the Molstar to see the change
                                    );
                                }}
                                onFork={() => {
                                    // TODO: update state tree
                                    // TODO: reload state tree
                                }}
                            />
                        ))}

                        {isStateTreeSingle && (
                            <NewViewCardCreator
                                index={props.views.length + 1}
                                onSave={(
                                    id,
                                    title,
                                    description,
                                    descriptionFormat,
                                    referenceCamera,
                                    thumbnail,
                                ) => {
                                    props.setViews((prev) => [
                                        ...prev,
                                        {
                                            id: id,
                                            key: id,
                                            title: title,
                                            description: description,
                                            description_format:
                                                descriptionFormat,
                                            referenceCamera: referenceCamera,
                                            thumbnail: thumbnail,
                                            linger_duration_ms: 5000,
                                            transition_duration_ms: undefined,
                                        },
                                    ]);

                                    // TODO: update state tree

                                    // Add current snapshot to the Molstar snapshot manager.
                                    addNewSnapshotToManager(
                                        "gregergergher",
                                        "HELLO",
                                        "fretgreyheryher",
                                    );
                                    // TODO: reload state tree
                                }}
                            />
                        )}
                    </div>
                </div>
            )}
        </Sidebar>
    );
}
