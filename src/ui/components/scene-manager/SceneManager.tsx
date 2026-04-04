import { useEffect, useState } from "react";
import { SegmentedController } from "../common/segmented-controller/SegmentedController";
import { Sidebar } from "../common/sidebar/Sidebar";
import { ViewCard } from "../view-card/ViewCard";
import {
    addNewSnapshotToManager,
    addViewIntoStateTree,
    applyChangesToNode,
    applySnapshotByIndex,
    getCurrentSnapshotIndex,
    getSnapshotChangeSubscription,
    updateSnapshotInManager,
    type Base64Png,
    type CameraState,
    type HexColor,
    type ViewMetadata,
} from "../../../molstar-wrapper/src";
import { useRegime, type Regime } from "../../services/RegimeProvider";
import type { Subscription } from "rxjs";
import { pushErrorNotification } from "../../services/NotificationService";

interface SceneManagerProps {
    isMolstarExpanded: boolean;
    isMolstarLoading: boolean;
}

export function SceneManager(props: SceneManagerProps) {
    // Sidebar state.
    type SidebarType = "views" | "seg" | "anno";
    const [sidebar, setSidebar] = useState<SidebarType>("views");

    // Regime.
    const { regime, setRegime } = useRegime();

    // State for the index of currently active view card (default is the first one).
    const [activeViewCardIndex, setActiveViewCardIndex] = useState(0);

    // Callback for snapshot selected changed from Molstar UI.
    useEffect(() => {
        let sub: Subscription;
        if (!props.isMolstarLoading) {
            // We reset the index according to `molstar.managers.snapshot.state.current` as soon as the information is available for us.
            setActiveViewCardIndex(getCurrentSnapshotIndex());

            sub = getSnapshotChangeSubscription((index, _) => {
                setActiveViewCardIndex(index);
            });
        }

        return () => {
            if (sub) sub.unsubscribe();
        };
    }, [props.isMolstarLoading]);

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
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "1em",
                        }}
                    >
                        {regime.kind === "viewing" &&
                            regime.views.map((view, index) => (
                                <ViewCard
                                    key={view.id}
                                    metadata={view}
                                    index={index}
                                    cameraState={cameraState}
                                    active={index === activeViewCardIndex}
                                    onClick={async () => {
                                        await applySnapshotByIndex(index);
                                        //setActiveViewCardIndex(index);
                                    }}
                                    onSave={(
                                        title,
                                        description,
                                        descriptionFormat,
                                        referenceCamera,
                                        thumbnail,
                                        backgroundColor,
                                    ) => {
                                        handleOnUpdate(
                                            regime,
                                            setRegime,
                                            index,
                                            view.id,
                                            title,
                                            description,
                                            descriptionFormat,
                                            referenceCamera,
                                            thumbnail,
                                            backgroundColor,
                                        );
                                    }}
                                    onFork={(
                                        id,
                                        title,
                                        description,
                                        descriptionFormat,
                                        referenceCamera,
                                        thumbnail,
                                        backgroundColor,
                                    ) => {
                                        handleOnFork(
                                            regime,
                                            setRegime,
                                            index,
                                            id,
                                            title,
                                            description,
                                            descriptionFormat,
                                            referenceCamera,
                                            thumbnail,
                                            backgroundColor,
                                        );
                                    }}
                                />
                            ))}
                    </div>
                </div>
            )}
        </Sidebar>
    );
}

function handleOnFork(
    regime: Regime,
    setRegime: (regime: Regime) => void,
    activeViewCardIndex: number,
    id: string,
    title: string,
    description: string | undefined,
    descriptionFormat: "markdown" | "plaintext" | undefined,
    referenceCamera: CameraState,
    thumbnail: Base64Png | undefined,
    backgroundColor: HexColor | undefined,
): void {
    // Create new view.
    const newView: ViewMetadata = {
        id: id,
        key: id,
        title: title,
        description: description,
        description_format: descriptionFormat,
        referenceCamera: referenceCamera,
        backgroundColor: backgroundColor,
        thumbnail: thumbnail,
        linger_duration_ms: 5000,
        transition_duration_ms: undefined,
    };

    // Add new snapshot to the Molstar manager.
    addNewSnapshotToManager(
        id,
        title,
        description,
        descriptionFormat || "plaintext",
    );

    // Update state tree.
    if (regime.kind === "viewing" && regime.stateTree.kind === "multiple") {
        // Create copy of current root and apply changes to it.
        const newNode = applyChangesToNode(
            regime.stateTree.snapshots[activeViewCardIndex].root,
            {
                referenceCamera: referenceCamera,
                thumbnail: thumbnail,
                backgroundColor: backgroundColor,
            },
        );

        const newStateTree = addViewIntoStateTree(regime.stateTree, {
            node: newNode,
            metadata: {
                id: id,
                key: id,
                title: title,
                description: description,
                description_format: descriptionFormat,
                referenceCamera: referenceCamera,
                backgroundColor: backgroundColor,
                thumbnail: thumbnail,
                linger_duration_ms: 5000,
                transition_duration_ms: undefined,
            },
        });

        setRegime({
            ...regime,
            stateTree: newStateTree,
            views: [...regime.views, newView],
        });
    }
}

function handleOnUpdate(
    regime: Regime,
    setRegime: (regime: Regime) => void,
    activeViewCardIndex: number,
    id: string,
    title: string,
    description: string | undefined,
    descriptionFormat: "markdown" | "plaintext" | undefined,
    referenceCamera: CameraState,
    thumbnail: Base64Png | undefined,
    backgroundColor: HexColor | undefined,
): void {
    // Update existing snapshot in the Molstar manager by its index.
    const result = updateSnapshotInManager(
        activeViewCardIndex,
        title,
        description,
        descriptionFormat || "plaintext",
    );

    if (!result.success) {
        pushErrorNotification(
            `Internal error occured while updating snapshot in Molstar snapshots' manager: "${result.error.message}"!`,
        );
        return;
    }

    // Update state tree.
    if (regime.kind === "viewing" && regime.stateTree.kind === "multiple") {
        const updatedSnapshots = [...regime.stateTree.snapshots];
        const snapshotToUpdate = { ...updatedSnapshots[activeViewCardIndex] };

        snapshotToUpdate.root = applyChangesToNode(snapshotToUpdate.root, {
            referenceCamera: referenceCamera,
            thumbnail: thumbnail,
            backgroundColor: backgroundColor,
        });

        snapshotToUpdate.metadata = {
            ...snapshotToUpdate.metadata,
            title: title,
            description: description,
            description_format: descriptionFormat,
            linger_duration_ms: 5000,
            transition_duration_ms: undefined,
        };

        updatedSnapshots[activeViewCardIndex] = snapshotToUpdate;

        setRegime({
            ...regime,
            views: regime.views.map((view) =>
                view.id === id
                    ? {
                          ...view,
                          title,
                          description,
                          description_format: descriptionFormat,
                          referenceCamera,
                          thumbnail,
                          backgroundColor,
                          linger_duration_ms: 5000,
                          transition_duration_ms: undefined,
                      }
                    : view,
            ),
            stateTree: {
                ...regime.stateTree,
                snapshots: updatedSnapshots,
            },
        });
    }
}
