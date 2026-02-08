import { useEffect, useState } from "react";
import { SegmentedController } from "../common/segmented-controller/SegmentedController";
import { Sidebar } from "../common/sidebar/Sidebar";
import { Button } from "../common/button/Button";
import { ViewCard } from "../view-card/ViewCard";
import {
    addNewSnapshotToManager,
    addViewIntoStateTree,
    applyChangesToNode,
    applySnapshotByIndex,
    clearAllSnapshotsFromManager,
    convertStateTreeFromSingleToMultipleKind,
    getSnapshotChangeSubscription,
    updateSnapshotInManager,
    type Base64Png,
    type CameraState,
    type ViewMetadata,
} from "../../../molstar-wrapper/src";
import { NewViewCardCreator } from "../view-card/NewViewCardCreator";
import { useFileData, type Regime } from "../../services/FileDataProvider";
import type { Subscription } from "rxjs";

interface SceneManagerProps {
    isMolstarExpanded: boolean;
    isMolstarLoading: boolean;
    views: ViewMetadata[];
    setViews: React.Dispatch<React.SetStateAction<ViewMetadata[]>>;
}

export function SceneManager(props: SceneManagerProps) {
    // Sidebar state.
    type SidebarType = "views" | "seg" | "anno";
    const [sidebar, setSidebar] = useState<SidebarType>("views");

    const { regime, setRegime } = useFileData();

    const [activeViewCardIndex, setActiveViewCardIndex] = useState(0);

    const isStateTreeSingle = props.views.length === 0;

    useEffect(() => {
        let snapshotChangeSubscription: Subscription;
        if (!props.isMolstarLoading) {
            snapshotChangeSubscription = getSnapshotChangeSubscription(
                (index, _) => {
                    setActiveViewCardIndex(index);
                },
            );
        }

        return () => {
            if (snapshotChangeSubscription)
                snapshotChangeSubscription.unsubscribe();
        };
    }, [props.isMolstarLoading]);

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
                            console.log("Not implemented!");
                            // props.setViews(() => []);
                            // clearAllSnapshotsFromManager();
                            // TODO: clear views from state tree, but how? Should we erase them completely? Then we lose information about downloads nodes etc.
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
                                metadata={view}
                                index={index}
                                active={index === activeViewCardIndex}
                                onClick={async () => {
                                    await applySnapshotByIndex(index);
                                    setActiveViewCardIndex(index);
                                }}
                                onSave={(
                                    title,
                                    description,
                                    descriptionFormat,
                                    referenceCamera,
                                    thumbnail,
                                ) => {
                                    handleOnUpdate(
                                        regime,
                                        setRegime,
                                        props,
                                        index,
                                        view.id,
                                        title,
                                        description,
                                        descriptionFormat,
                                        referenceCamera,
                                        thumbnail,
                                    );
                                }}
                                onFork={(
                                    id,
                                    title,
                                    description,
                                    descriptionFormat,
                                    referenceCamera,
                                    thumbnail,
                                ) => {
                                    handleOnFork(
                                        regime,
                                        setRegime,
                                        props,
                                        index,
                                        id,
                                        title,
                                        description,
                                        descriptionFormat,
                                        referenceCamera,
                                        thumbnail,
                                    );
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
                                    handleOnSave(
                                        regime,
                                        setRegime,
                                        props,
                                        id,
                                        title,
                                        description,
                                        descriptionFormat,
                                        referenceCamera,
                                        thumbnail,
                                    );
                                }}
                            />
                        )}
                    </div>
                </div>
            )}
        </Sidebar>
    );
}

function handleOnSave(
    regime: Regime,
    setRegime: (regime: Regime) => void,
    props: SceneManagerProps,
    id: string,
    title: string,
    description: string | undefined,
    descriptionFormat: "markdown" | "plaintext" | undefined,
    referenceCamera: CameraState,
    thumbnail: Base64Png | undefined,
): void {
    // Add view to the list.
    props.setViews((prev) => [
        ...prev,
        {
            id: id,
            key: id,
            title: title,
            description: description,
            description_format: descriptionFormat,
            referenceCamera: referenceCamera,
            thumbnail: thumbnail,
            linger_duration_ms: 5000,
            transition_duration_ms: undefined,
        },
    ]);

    // Clear the default "global" snapshot from Molstar manager andd to it a new current snapshot.
    clearAllSnapshotsFromManager();
    addNewSnapshotToManager(
        id,
        title,
        description,
        descriptionFormat || "plaintext",
    );

    // Update state tree.
    if (regime.kind === "viewing" && regime.stateTree.kind !== "multiple") {
        // Create copy of current root and apply changes to it.
        const newNode = applyChangesToNode(regime.stateTree.root, {
            referenceCamera: referenceCamera,
            thumbnail: thumbnail,
        });

        // State tree is converted to multiple kind.
        setRegime({
            ...regime,
            stateTree: convertStateTreeFromSingleToMultipleKind(
                regime.stateTree,
                {
                    node: newNode,
                    metadata: {
                        id: id,
                        key: id,
                        title: title,
                        description: description,
                        description_format: descriptionFormat,
                        referenceCamera: referenceCamera,
                        thumbnail: thumbnail,
                        linger_duration_ms: 5000,
                        transition_duration_ms: undefined,
                    },
                },
            ),
        });
    }
}

function handleOnFork(
    regime: Regime,
    setRegime: (regime: Regime) => void,
    props: SceneManagerProps,
    activeViewCardIndex: number,
    id: string,
    title: string,
    description: string | undefined,
    descriptionFormat: "markdown" | "plaintext" | undefined,
    referenceCamera: CameraState,
    thumbnail: Base64Png | undefined,
): void {
    // Add view to the list.
    props.setViews((prev) => [
        ...prev,
        {
            id: id,
            key: id,
            title: title,
            description: description,
            description_format: descriptionFormat,
            referenceCamera: referenceCamera,
            thumbnail: thumbnail,
            linger_duration_ms: 5000,
            transition_duration_ms: undefined,
        },
    ]);

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
                thumbnail: thumbnail,
                linger_duration_ms: 5000,
                transition_duration_ms: undefined,
            },
        });

        setRegime({ ...regime, stateTree: newStateTree });
    }
}

function handleOnUpdate(
    regime: Regime,
    setRegime: (regime: Regime) => void,
    props: SceneManagerProps,
    activeViewCardIndex: number,
    id: string,
    title: string,
    description: string | undefined,
    descriptionFormat: "markdown" | "plaintext" | undefined,
    referenceCamera: CameraState,
    thumbnail: Base64Png | undefined,
): void {
    // Update view in the list.
    props.setViews((prev) =>
        prev.map((view) =>
            view.id === id
                ? {
                      ...view,
                      title: title,
                      description: description,
                      description_format: descriptionFormat,
                      referenceCamera: referenceCamera,
                      thumbnail: thumbnail,
                      linger_duration_ms: 5000,
                      transition_duration_ms: undefined,
                  }
                : view,
        ),
    );

    // Update existing snapshot in the Molstar manager by its index.
    const result = updateSnapshotInManager(
        activeViewCardIndex,
        title,
        description,
        descriptionFormat || "plaintext",
    );

    if (!result.success) {
        // TODO: report an error
        console.log(`Error: <${result.error}>!`);
        return;
    }

    // Update state tree.
    if (regime.kind === "viewing" && regime.stateTree.kind === "multiple") {
        const updatedSnapshots = [...regime.stateTree.snapshots];
        const snapshotToUpdate = { ...updatedSnapshots[activeViewCardIndex] };

        snapshotToUpdate.root = applyChangesToNode(snapshotToUpdate.root, {
            referenceCamera: referenceCamera,
            thumbnail: thumbnail,
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
            stateTree: {
                ...regime.stateTree,
                snapshots: updatedSnapshots,
            },
        });
    }
}
