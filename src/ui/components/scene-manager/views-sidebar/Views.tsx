import { useEffect, useMemo, useState, useRef } from "react";
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

interface ViewsProps {
    isMolstarLoading: boolean;
    isBuilderOpen: boolean;
    onOpenBuilder?: (key: string | undefined) => void;
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

    // We use a reference to safely pass the latest variables into the Molstar event listener without having to tear down and rebuild the subscription every time a view changes.
    const latestDataRef = useRef({
        isBuilderOpen: props.isBuilderOpen,
        viewItems,
    });
    useEffect(() => {
        latestDataRef.current = {
            isBuilderOpen: props.isBuilderOpen,
            viewItems,
        };
    }, [props.isBuilderOpen, viewItems]);

    // Callback for snapshot selected changed from Molstar UI.
    useEffect(() => {
        let sub: Subscription;
        if (!props.isMolstarLoading) {
            // We reset the index according to `molstar.managers.snapshot.state.current` as soon as the information is available for us.
            setActiveViewCardIndex(getCurrentSnapshotIndex());

            sub = getSnapshotChangeSubscription((index, _) => {
                setActiveViewCardIndex(index);
                const { isBuilderOpen, viewItems } = latestDataRef.current;
                if (isBuilderOpen && props.onOpenBuilder) {
                    const newView = viewItems[index];
                    if (newView) {
                        props.onOpenBuilder(newView.key);
                    }
                }
            });
        }

        return () => {
            if (sub) sub.unsubscribe();
        };
    }, [props.isMolstarLoading, props.onOpenBuilder]);

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

                            const newKey =
                                result.createdNode.metadata.key ??
                                crypto.randomUUID();

                            addNewSnapshotToManager(
                                newKey,
                                result.createdNode.metadata.title ?? "New View",
                                result.createdNode.metadata.description,
                                result.createdNode.metadata
                                    .description_format ?? "markdown",
                                true,
                            );

                            await applySnapshotByIndex(viewItems.length);

                            if (props.isBuilderOpen && props.onOpenBuilder) {
                                props.onOpenBuilder(newKey);
                            }
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
                                if (
                                    props.isBuilderOpen &&
                                    props.onOpenBuilder
                                ) {
                                    props.onOpenBuilder(view.key);
                                }
                            }}
                        ></InactiveViewCard>
                    ),
                )}
            </div>
        </div>
    );
}
