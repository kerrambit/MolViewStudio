import { useEffect, createRef, /*type RefObject,*/ useState } from "react";
import { Link } from "react-router-dom";
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
    getCameraState,
    setCamera,
    getCanvasImageAsUri,
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

export function Viewer() {
    const { t } = useTranslation();
    const { /*snapshot,*/ setSnapshot } = useMolstar();
    const colorScheme = useComputedColorScheme();
    const [molstarLoading, setMolstarLoading] = useState(true);
    const { deleteRootMenuItem, addRootMenuItem } = useMenu();
    const { fileData, regime } = useFileData();

    const edit = createEditRootMenuItem(t);
    useEffect(() => {
        addRootMenuItem(edit);
        return () => {
            deleteRootMenuItem(edit.id);
        };
    }, []);

    type CameraView = CameraState & {
        id: string;
        thumbnail?: Base64Png;
    };
    const [views, setViews] = useState<CameraView[]>([]);

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
            <nav>
                <Link to="/">{t("Home")}</Link> |{" "}
                <Link to="/settings">{t("Settings")}</Link> |{" "}
                <Link to="/viewer">{t("Viewer")}</Link> |{" "}
                <Link to="/sidebar">{t("Sidebar page")}</Link> |{" "}
            </nav>
            <div
                style={{ display: "flex", height: "95%", position: "relative" }}
            >
                <LoadingOverlay
                    visible={molstarLoading}
                    zIndex={1000}
                    overlayProps={{ radius: "sm", blur: 2 }}
                    loaderProps={{ type: "oval" }}
                />
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        paddingTop: "1em",
                        paddingLeft: "0.5em",
                    }}
                >
                    <Button
                        size="small"
                        onClick={() => {
                            loadStructureFromFile();
                        }}
                    >
                        {t("viewer.Load structure from file...")}
                    </Button>
                    <Button
                        size="small"
                        onClick={() => {
                            loadDefaultPbdStructure();
                        }}
                    >
                        {t("viewer.Load default PBD structure")}
                    </Button>
                    <Button
                        size="small"
                        onClick={() => {
                            loadDefaultMVSJFile();
                        }}
                    >
                        {"Load default MVSJ structure"}
                    </Button>
                    <Button
                        size="small"
                        onClick={() => {
                            loadDefaultMVSXFile();
                        }}
                    >
                        {"Load default MVSX structure"}
                    </Button>
                    <Button
                        size="small"
                        onClick={() => {
                            setViews(() => []);
                        }}
                    >
                        {t("viewer.Clear views")}
                    </Button>
                    <Button
                        size="small"
                        onClick={() => {
                            // TODO: check that any data were uploaded, empty view should not be saved
                            const cameraData = getCameraState();
                            getCanvasImageAsUri()
                                .then((img) => {
                                    setViews((prev) => [
                                        ...prev,
                                        {
                                            ...cameraData,
                                            id: crypto.randomUUID(),
                                            thumbnail: img,
                                        },
                                    ]);
                                })
                                .catch(() => {
                                    setViews((prev) => [
                                        ...prev,
                                        {
                                            ...cameraData,
                                            id: crypto.randomUUID(),
                                        },
                                    ]);
                                });
                        }}
                    >
                        {t("viewer.Save view")}
                    </Button>
                    <div
                        style={{
                            maxWidth: "15em",
                        }}
                    >
                        <b>Views:</b>
                        {views.map((view, index) => (
                            <div
                                key={`$view:${view.id}`}
                                style={{
                                    cursor: "grab",
                                    border: "1px solid var(--mantine-primary-color-7)",
                                }}
                                onClick={() => {
                                    setCamera({
                                        position: view.position,
                                        up: view.up,
                                        target: view.target,
                                    });
                                }}
                            >
                                <h6 key={`id:${view.id}`}>{index + 1}. View</h6>
                                <img
                                    key={`$img:${view.id}`}
                                    src={view.thumbnail}
                                    style={{
                                        border: "2px solid var(--mantine-primary-color-4)",
                                    }}
                                    width={"100%"}
                                    height={"100%"}
                                    alt={`${index + 1}. view thumbnail`}
                                />
                            </div>
                        ))}
                    </div>
                </div>
                <main style={{ flex: 1, padding: "1em", minHeight: 0 }}>
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
    // TODO: use this icon: https://fontawesome.com/icons/broom?f=classic&s=solid.
    const clearViewerItem: MenuItem = {
        id: crypto.randomUUID(),
        title: t("menu.pageSpecific.viewer.Clear viewer"),
        task: {
            action: () => {
                clearViewer();
            },
            type: "direct",
        },
    };
    const section: Section = {
        id: crypto.randomUUID(),
        items: [clearViewerItem],
    };
    const edit: RootMenuItem = {
        id: crypto.randomUUID(),
        title: "Edit",
        task: [section],
        priority: 3,
    };

    return edit;
}
