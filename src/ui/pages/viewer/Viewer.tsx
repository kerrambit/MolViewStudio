import {
    useEffect,
    createRef,
    useState,
    type Dispatch,
    type SetStateAction,
} from "react";
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
    downloadViewerState,
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
import { useProcessVolume } from "../../hooks/useProcessVolume";

export type CameraView = CameraState & {
    id: string;
    title: string;
    thumbnail?: Base64Png;
};

export function Viewer() {
    const { t } = useTranslation();
    const { snapshot, setSnapshot } = useMolstar();
    const colorScheme = useComputedColorScheme();
    const [molstarLoading, setMolstarLoading] = useState(true);
    const { fileData, regime } = useFileData();
    const { deleteRootMenuItem, addRootMenuItem } = useMenu();

    const processVolume = useProcessVolume();
    const [volumes, setVolumes] = useState<string[]>([]);

    // Views.
    const [views, setViews] = useState<CameraView[]>([]);

    // Add Edit root item button into the menu.
    useEffect(() => {
        const edit = createEditRootMenuItem(t, views, setViews);
        addRootMenuItem(edit);
        return () => {
            deleteRootMenuItem(edit.id);
        };
    }, [t, views, setViews]);

    // Sidebar state.
    type SidebarType = "views" | "seg" | "anno";
    const [sidebar, setSidebar] = useState<SidebarType>("views");

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
            snapshot
        ).then(async () => {
            // translateMolstarUi(parentRef);
            setMolstarLoading(false);
            if (regime === "toView" && fileData && !snapshot) {
                const result = await loadDataFromFile(fileData);
                if (result) {
                    setViews(result);
                }
            }
        });

        return () => {
            const freshSnapshot = getSnapshot();
            setSnapshot(freshSnapshot);
            disposeMolstar();
        };
    }, [setSnapshot]);

    useEffect(() => {
        if (!fileData || regime !== "toProcess") {
            return;
        }

        processVolume.mutate(fileData.path, {
            onSuccess: async (response) => {
                try {
                    const responseBody = await response.json();

                    const filePathsJsonString = responseBody.output_files;

                    if (typeof filePathsJsonString !== "string") {
                        throw new Error(
                            "Expected 'output_files' to be a JSON string."
                        );
                    }

                    const absolutePathsArray = JSON.parse(filePathsJsonString);
                    setVolumes(absolutePathsArray);
                } catch (e) {
                    console.log("Failed to parse or process response data:", e);
                }
            },
            onError: (err) => {
                console.log(`Processing failed: ${err.message}`);
            },
        });
    }, [fileData, setVolumes]);

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
                    {processVolume.isPending && "Processing..."}
                    {processVolume.isSuccess &&
                        `Processing finished succefully: ${volumes}`}
                </Sidebar>
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
    const result = await window.electron.openFileExplorer();

    // TODO: openFileExplorer temporary return FileData[] instead of FileData, this we need to look for the first element here
    const fileData: FileData | null =
        result && result.length > 0 ? result[0] : null;

    // TODO: will handle this function better, now it returns just null or CameraView array
    const loadResult = await loadDataFromFile(fileData);
    if (loadResult) {
        return loadResult;
    }
    return [];
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

function createEditRootMenuItem(
    t: TFunction<"translation", undefined>,
    views: CameraView[],
    setViews: Dispatch<SetStateAction<CameraView[]>>
) {
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
            action: async () => {
                const fileData = await window.electron.openFileExplorer();
                downloadViewerState(fileData, views);
            },
            type: "direct",
        },
    };

    const loadStructureFromFileItem: MenuItem = {
        id: "load-structure-from-file",
        title: "Load structure from file",
        task: {
            action: () => {
                setViews(() => []);
                (async () => {
                    try {
                        const newViews = await loadStructureFromFile();
                        setViews(newViews);
                    } catch (error) {}
                })();
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
