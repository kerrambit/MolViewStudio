/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { ViewCard } from "../view-card/ViewCard";
import { InactiveViewCard } from "../view-card/InactiveViewCard";
import { CreateViewCard } from "../view-card/CreateViewCard";
import { useViewsManagement } from "../../../hooks/useViewsManagement";
import { AutoScrollList } from "../../../../../components/common/auto-scroll-list/AutoScrollList";

interface ViewsProps {
    isMolstarLoading: boolean;
    isBuilderOpen: boolean;
    onOpenBuilder?: (key: string | undefined) => void;
}

export function Views(props: ViewsProps) {
    // Use views management.
    const {
        viewItems,
        activeViewCardIndex,
        handleCreateView,
        handleDeleteView,
        handleCopyView,
        handleCameraSave,
        handleBackgroundColorChange,
        handleTitleChange,
        handleOpenOptions,
        handleSelectActiveView,
    } = useViewsManagement(props);

    // Render the component.
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
                {/* Render creation card first. */}
                <CreateViewCard onClick={handleCreateView} />

                {/* Map dynamic views. */}
                <AutoScrollList
                    list={viewItems}
                    activeIndex={activeViewCardIndex}
                    renderItem={(view, index) =>
                        index === activeViewCardIndex ? (
                            <ViewCard
                                key={view.key}
                                index={index}
                                metadata={view}
                                onDelete={() => handleDeleteView(index, view)}
                                onCopy={() => handleCopyView(index)}
                                onCameraSave={(camera, thumbnail) =>
                                    handleCameraSave(
                                        index,
                                        view,
                                        camera,
                                        thumbnail,
                                    )
                                }
                                onBackgrounColorChange={(color) =>
                                    handleBackgroundColorChange(view, color)
                                }
                                onTitleChange={(title) =>
                                    handleTitleChange(index, view, title)
                                }
                                onOpenOptions={(key) =>
                                    handleOpenOptions(index, view, key)
                                }
                                onOpenBuilder={props.onOpenBuilder}
                            />
                        ) : (
                            <InactiveViewCard
                                key={view.key}
                                index={index}
                                title={view.title}
                                thumbnail={view.thumbnail}
                                onClick={() =>
                                    handleSelectActiveView(index, view)
                                }
                            />
                        )
                    }
                ></AutoScrollList>
            </div>
        </div>
    );
}
