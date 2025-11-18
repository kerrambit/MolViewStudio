import { useEffect, createRef, /*type RefObject,*/ useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/common/button/Button";
import {
    clearViewer,
    initMolstar,
    loadDefaultPbdStructure,
    disposeMolstar,
    loadDataFromFile,
    getSnapshot,
    type CameraState,
    setCamera,
    type Base64Png,
    loadDefaultMVSJFile,
    loadDefaultMVSXFile,
} from "../../../molstar-wrapper/src";

import "./Viewer.css";
import "molstar/lib/mol-plugin-ui/skin/light.scss";
import { useMolstar } from "../../services/MolstarProvider";
import { LoadingOverlay, useComputedColorScheme } from "@mantine/core";
import {
    useMenu,
    type MenuItem,
    type RootMenuItem,
    type Section,
} from "../../services/MenuProvider";
import type { TFunction } from "i18next";
import { useFileData } from "../../services/FileDataProvider";
import { BroomIcon } from "../../components/icons/BroomIcon";
import { Sidebar } from "../../components/common/sidebar/Sidebar";
import { ViewCard } from "../../components/view-card/ViewCard";
import { NewViewCardCreator } from "../../components/view-card/NewViewCardCreator";
import { IconPackageExport } from "@tabler/icons-react";
import { SegmentedController } from "../../components/common/segmented-controller/SegmentedController";

export function Viewer() {
    const { t } = useTranslation();
    const { /*snapshot,*/ setSnapshot } = useMolstar();
    const colorScheme = useComputedColorScheme();
    const [molstarLoading, setMolstarLoading] = useState(true);
    const { fileData, regime } = useFileData();

    // Add Edit root item button into the menu.
    const { deleteRootMenuItem, addRootMenuItem } = useMenu();
    const edit = createEditRootMenuItem(t);
    useEffect(() => {
        addRootMenuItem(edit);
        return () => {
            deleteRootMenuItem(edit.id);
        };
    }, []);

    // Current sidebar tab.
    type SidebarType = "views" | "seg" | "anno";
    const [sidebar, setSidebar] = useState<SidebarType>("views");

    type CameraView = CameraState & {
        id: string;
        title: string;
        thumbnail?: Base64Png;
    };
    const [views, setViews] = useState<CameraView[]>([]);

    // Initialize Molstar viewer.
    const parentRef = createRef<HTMLDivElement>();
    useEffect(() => {
        initMolstar(
            parentRef.current as HTMLDivElement,
            {
                showControls: true,
                isExpanded: false,
                darkMode: colorScheme === "dark",
            },
            null
        ).then(() => {
            // translateMolstarUi(parentRef);
            setMolstarLoading(false);
            if (regime === "toView" && fileData /*&& !snapshot*/) {
                loadDataFromFile(fileData);
            }
        });

        return () => {
            const freshSnapshot = getSnapshot();
            setSnapshot(freshSnapshot);
            disposeMolstar();
        };
    }, [setSnapshot]);

    return (
        <div className="viewer">
            <div className="viewer-content">
                <LoadingOverlay
                    visible={molstarLoading}
                    zIndex={1000}
                    overlayProps={{ radius: "sm", blur: 2 }}
                    loaderProps={{ type: "oval" }}
                />
                <Sidebar
                    style={{
                        gap: ".5em",
                        padding: ".5em",
                    }}
                >
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

                    {sidebar === "views" && (
                        <>
                            <Button
                                size="small"
                                onClick={() => {
                                    setViews(() => []);
                                }}
                            >
                                {"Clear view"}
                            </Button>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "1em",
                                }}
                            >
                                {views.map((view, index) => (
                                    <ViewCard
                                        key={view.id}
                                        title={view.title}
                                        index={index}
                                        thumbnail={view.thumbnail}
                                        onClick={() => {
                                            setCamera({
                                                position: view.position,
                                                up: view.up,
                                                target: view.target,
                                            });
                                        }}
                                        onSave={(newTitle: string) => {
                                            setViews((prevViews) =>
                                                prevViews.map((v) =>
                                                    v.id === view.id
                                                        ? {
                                                              ...v,
                                                              title: newTitle,
                                                          }
                                                        : v
                                                )
                                            );
                                        }}
                                    />
                                ))}
                                <NewViewCardCreator
                                    index={views.length + 1}
                                    onSave={(
                                        position,
                                        up,
                                        target,
                                        title,
                                        id,
                                        thumbnail
                                    ) => {
                                        setViews((prev) => [
                                            ...prev,
                                            {
                                                id: id,
                                                title: title,
                                                thumbnail: thumbnail,
                                                target: target,
                                                position: position,
                                                up: up,
                                            },
                                        ]);
                                    }}
                                />
                            </div>
                        </>
                    )}
                </Sidebar>
                <main style={{ flex: 1, padding: "0.5em", minHeight: 0 }}>
                    <div
                        ref={parentRef}
                        style={{
                            width: "100%",
                            height: "100%",
                        }}
                    />
                </main>
            </div>
        </div>
    );
}

async function loadStructureFromFile() {
    const fileData = await window.electron.openFileExplorer();
    loadDataFromFile(fileData);
}

// async function translateMolstarUi(parent: RefObject<HTMLDivElement | null>) {
//     const btn = parent.current?.querySelector(
//         'button[title="Reset Zoom"]'
//     ) as HTMLButtonElement;
//     if (btn) btn.title = "Custom Reset";
//     const btn2 = parent.current?.querySelector(
//         'button[title*="Set camera zoom to fit"]'
//     ) as HTMLButtonElement;
//     if (btn) {
//         btn2.title = "Custom Reset Tooltip";
//         btn2.textContent = "Custom Reset";
//     }

//     const screenshotBtn = parent.current?.querySelector(
//         'button[title="Screenshot / State Snapshot"]'
//     ) as HTMLButtonElement;
//     if (screenshotBtn) screenshotBtn.style.display = "none";

//     const toggleControlsBtn = parent.current?.querySelector(
//         'button[title="Toggle Controls Panel"]'
//     ) as HTMLButtonElement;
//     if (toggleControlsBtn) toggleControlsBtn.style.display = "none";
// }

function createEditRootMenuItem(t: TFunction<"translation", undefined>) {
    const clearViewerItem: MenuItem = {
        id: "clear-viewer",
        title: t("menu.pageSpecific.viewer.Clear viewer"),
        icon: { icon: BroomIcon, position: "left" },
        task: {
            action: () => {
                clearViewer();
            },
            type: "direct",
        },
    };

    const exportViewerItem: MenuItem = {
        id: "export",
        title: "Export",
        icon: { icon: IconPackageExport, position: "left" },
        task: {
            action: () => {
                downloadViewerState();
            },
            type: "direct",
        },
    };

    const loadStructureFromFileItem: MenuItem = {
        id: "load-structure-from-file",
        title: "Load structure from file",
        task: {
            action: () => {
                loadStructureFromFile();
            },
            type: "direct",
        },
    };

    const loadDefaultPBDItem: MenuItem = {
        id: "load-default-pbd",
        title: "Load default PBD",
        task: {
            action: () => {
                loadDefaultPbdStructure();
            },
            type: "direct",
        },
    };

    const loadDefaultMVSJItem: MenuItem = {
        id: "load-default-mvsj",
        title: "Load default MVSJ",
        task: {
            action: () => {
                loadDefaultMVSJFile();
            },
            type: "direct",
        },
    };

    const loadDefaultMVSXItem: MenuItem = {
        id: "load-default-mvsx",
        title: "Load default MVSX",
        task: {
            action: () => {
                loadDefaultMVSXFile();
            },
            type: "direct",
        },
    };

    const section: Section = {
        id: "general-edit",
        items: [
            clearViewerItem,
            exportViewerItem,
            loadStructureFromFileItem,
            loadDefaultPBDItem,
            loadDefaultMVSJItem,
            loadDefaultMVSXItem,
        ],
    };
    const edit: RootMenuItem = {
        id: "edit",
        title: "Edit",
        task: [section],
        priority: 3,
    };

    return edit;
}
