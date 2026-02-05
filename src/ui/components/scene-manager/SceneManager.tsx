import { useState } from "react";
import { SegmentedController } from "../common/segmented-controller/SegmentedController";
import { Sidebar } from "../common/sidebar/Sidebar";
import { Button } from "../common/button/Button";
import { ViewCard } from "../view-card/ViewCard";
import {
    fromMVSPosition,
    getCameraState,
    getDefaultCameraState,
    setCamera,
    type ViewMetaData,
} from "../../../molstar-wrapper/src";
import { NewViewCardCreator } from "../view-card/NewViewCardCreator";

interface SceneManagerProps {
    isMolstarExpanded: boolean;
    views: ViewMetaData[];
    setViews: React.Dispatch<React.SetStateAction<ViewMetaData[]>>;
}

export function SceneManager(props: SceneManagerProps) {
    // Sidebar state.
    type SidebarType = "views" | "seg" | "anno";
    const [sidebar, setSidebar] = useState<SidebarType>("views");

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
                <>
                    <Button
                        size="small"
                        onClick={() => {
                            props.setViews(() => []);
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
                                title={view.title}
                                index={index}
                                thumbnail={view.thumbnail}
                                onClick={() => {
                                    // Get the current camera state (for field of view and mode which are not included in MVS).
                                    const currentState =
                                        getCameraState() ||
                                        getDefaultCameraState();

                                    // Set the camera to the view using conversion from MVS "reference camera" position to Molstar real camera position.
                                    setCamera({
                                        ...view.referenceCamera,
                                        position: fromMVSPosition(
                                            view.referenceCamera
                                                .position as any,
                                            view.referenceCamera.target as any,
                                            currentState.fov,
                                            currentState.mode,
                                        ),
                                    });
                                }}
                                onSave={(newTitle: string) => {
                                    props.setViews((prevViews) =>
                                        prevViews.map((v) =>
                                            v.id === view.id
                                                ? {
                                                      ...v,
                                                      title: newTitle,
                                                  }
                                                : v,
                                        ),
                                    );
                                }}
                            />
                        ))}
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
                                        descriptionFormat: descriptionFormat,
                                        referenceCamera: referenceCamera,
                                        thumbnail: thumbnail,
                                    },
                                ]);
                            }}
                        />
                    </div>
                </>
            )}
        </Sidebar>
    );
}
