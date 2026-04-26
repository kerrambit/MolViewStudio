import { useEffect, useMemo, useState } from "react";
import { useRegime } from "../../../services/RegimeProvider";
import { ViewCard } from "../../view-card/ViewCard";
import {
    addEmptySnapshotToTree,
    addNewSnapshotToManager,
    applySnapshotByIndex,
    clearViewerContent,
    extractViewsFromMVS,
    getCurrentSnapshotIndex,
    getSnapshotChangeSubscription,
} from "../../../../molstar-wrapper/src";
import type { Subscription } from "rxjs";
import { InactiveViewCard } from "../../view-card/InactiveViewCard";
import { CreateViewCard } from "../../view-card/CreateViewCard";

/**
 * Props for Views component.
 */
interface ViewsProps {
    isMolstarLoading: boolean;
    onOpenBuilder?: (key: string) => void;
}

export function Views(props: ViewsProps) {
    // Use regime.
    const { regime, setRegime } = useRegime();

    // Memoize views extracted from state tree.
    const viewItems = useMemo(() => {
        if (regime.kind === "viewing") {
            return extractViewsFromMVS(regime.stateTree);
        }
        return [];
    }, [regime]);

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

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                marginTop: "0.5em",
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
                <CreateViewCard
                    onClick={async () => {
                        if (regime.kind === "viewing") {
                            const result = addEmptySnapshotToTree(
                                regime.stateTree,
                            );

                            setRegime({
                                ...regime,
                                stateTree: result.newStateTree,
                            });

                            await clearViewerContent();

                            addNewSnapshotToManager(
                                result.createdNode.metadata.key ??
                                    crypto.randomUUID(),
                                result.createdNode.metadata.title ?? "New View",
                                result.createdNode.metadata.description,
                                result.createdNode.metadata
                                    .description_format ?? "markdown",
                                true,
                            );

                            await applySnapshotByIndex(viewItems.length);
                        }
                    }}
                />

                {viewItems.map((view, index) =>
                    index === activeViewCardIndex ? (
                        <ViewCard
                            key={view.id}
                            index={index}
                            metadata={view}
                            onClick={async () => {
                                await applySnapshotByIndex(index);
                            }}
                            onOpenBuilder={props.onOpenBuilder}
                            onSave={(
                                title,
                                description,
                                descriptionFormat,
                                referenceCamera,
                                thumbnail,
                                backgroundColor,
                            ) => {
                                // handleOnUpdate(
                                //     regime,
                                //     setRegime,
                                //     index,
                                //     view.id,
                                //     title,
                                //     description,
                                //     descriptionFormat,
                                //     referenceCamera,
                                //     thumbnail,
                                //     backgroundColor,
                                // );
                                console.log(
                                    "Save",
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
                                // handleOnFork(
                                //     regime,
                                //     setRegime,
                                //     index,
                                //     id,
                                //     title,
                                //     description,
                                //     descriptionFormat,
                                //     referenceCamera,
                                //     thumbnail,
                                //     backgroundColor,
                                // );
                                console.log(
                                    "Fork",
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
                    ) : (
                        <InactiveViewCard
                            index={index}
                            key={view.key}
                            title={view.title}
                            thumbnail={view.thumbnail}
                            onClick={async () => {
                                await applySnapshotByIndex(index);
                            }}
                        ></InactiveViewCard>
                    ),
                )}
            </div>
        </div>
    );
}
