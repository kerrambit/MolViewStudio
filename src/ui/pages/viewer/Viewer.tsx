import {
    useEffect,
    createRef,
    useState,
    type Dispatch,
    type SetStateAction,
} from "react";
import { useTranslation } from "react-i18next";
import {
    clearViewer,
    initMolstar,
    disposeMolstar,
    loadFromFile,
    getSnapshot,
    prepareDataForDefaultMVS,
    createMVSBlob,
    getFullScreenSubscription,
    type ViewMetadata,
    type View,
    getPrimalViewCopy,
    exportStateTree,
} from "../../../molstar-wrapper/src";

import "./Viewer.css";
import "molstar/lib/mol-plugin-ui/skin/light.scss";
import { useMolstar } from "../../services/MolstarProvider";
import { LoadingOverlay } from "@mantine/core";
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
import { IconPackageExport } from "@tabler/icons-react";
import { useProcessVolume } from "../../hooks/useProcessVolume";
import { getFieldFromResponse } from "../../utils/responseUtils";
import type { Subscription } from "rxjs";
import type { MVSData } from "molstar/lib/extensions/mvs/mvs-data";
import { SceneManager } from "../../components/scene-manager/SceneManager";

export function Viewer() {
    // Use localization.
    const { t } = useTranslation();

    // Controlls Molstar snapshots.
    const { snapshot, setSnapshot } = useMolstar();

    // TODO: temporary state
    const [volumes, setVolumes] = useState<string[]>([]);

    // Imports hook vol-seg server communication.
    const processVolume = useProcessVolume();

    // Controls if Molstar is still in the initialization process.
    const [molstarLoading, setMolstarLoading] = useState(true);

    // Controls if the Molstar viewer is expanded or not.
    const [molstarExpanded, setMolstarExpanded] = useState(false);

    // Controls current regime of the application, stores current data.
    const { regime, setRegime } = useFileData(); // TODO: rename to useRegime() probably

    // Current view and views.
    const [views, setViews] = useState<ViewMetadata[]>([]);
    const [view, setView] = useState<View | undefined>(undefined);

    // Add Edit root item button into the menu.
    const { deleteRootMenuItem, addRootMenuItem } = useMenu();
    useEffect(() => {
        const edit = createEditRootMenuItem(
            t,
            regime.kind === "viewing" ? regime.stateTree : undefined,
            views,
            setViews,
            regime.kind === "viewing" && regime.deconstructedFile
                ? regime.deconstructedFile.assets
                : [],
        );
        addRootMenuItem(edit);
        return () => {
            deleteRootMenuItem(edit.id);
        };
    }, [t, views, setViews, regime]);

    // Initialize Molstar viewer.
    const parentRef = createRef<HTMLDivElement>();
    useEffect(() => {
        // Subscriptions.
        let fullScreenSubscription: Subscription;

        initMolstar(
            parentRef.current as HTMLDivElement,
            {
                showControls: true,
                isExpanded: false,
            },
            snapshot,
        ).then(async () => {
            setMolstarLoading(false);
            fullScreenSubscription = getFullScreenSubscription((val) => {
                setMolstarExpanded(val);
            });
        });

        return () => {
            const freshSnapshot = getSnapshot();
            setSnapshot(freshSnapshot);
            clearViewer();
            if (fullScreenSubscription) fullScreenSubscription.unsubscribe();
            disposeMolstar();
        };
    }, [setSnapshot]);

    // Start deconstruction of file to view.
    useEffect(() => {
        const deconstruct = async () => {
            // To prevent loop on this useEffect, guard clause was added to check if the deconstruction has already happened before you trigger the update.
            if (
                molstarLoading ||
                regime.kind !== "viewing" ||
                !regime.fileToView ||
                regime.deconstructedFile
            ) {
                return;
            }

            // Load the file.
            const result = await loadFromFile(regime.fileToView);
            if (!result) {
                // TODO: report an error
                return;
            }

            // Set the views in the editor.
            setViews(result.views);

            // Create an array with local assets (if there are some).
            const assetsArray: FileData[] = Object.entries(
                result.localAssets,
            ).map(([path, data]) => ({
                path: path,
                name: path,
                content: data,
                extension: "." + path.split(".").pop() || "",
                binary: true,
            }));

            const primalView = getPrimalViewCopy(result.stateTree);

            // This can happen if the stateTree is of "multiple" kind, but has no snapshots. In our case, we report an error.
            if (!primalView) {
                // TODO: report an error
                console.log("No snapshots found in state tree!");
                return;
            }

            setView(primalView);

            // Set the regime with new assets and state tree.
            setRegime({
                ...regime,
                deconstructedFile: { assets: assetsArray },
                stateTree: result.stateTree,
            });
        };

        deconstruct();
    }, [regime, molstarLoading]);

    // Start processing of volumetric data.
    useEffect(() => {
        if (regime.kind !== "processing" || !regime.fileToProcess) {
            return;
        }

        processVolume.mutate(regime.fileToProcess.path, {
            onSuccess: async (response) => {
                // Parse string array containing absolute paths.
                let absolutePaths: string[] = [];
                try {
                    absolutePaths = await getFieldFromResponse<string[]>(
                        response,
                        "output_files",
                        "string",
                    );
                } catch (error) {
                    // TODO: report an error
                    console.log(error);
                }

                setVolumes(absolutePaths);

                // Read assets from processed volume file.
                const assets = await window.electron.getFileData(absolutePaths);

                if (!assets) {
                    // TODO: report an error
                    return;
                }

                // Create MVS bundle from assets, containing just default view.
                const defaultMVSData = await prepareDataForDefaultMVS(assets);

                // Path for temporary MVS processed file.
                const path = `${`Processing/${new Date().toISOString().replace(/:/g, "-")}/MVS/tmp`}.${
                    defaultMVSData.extension
                }`;

                // Create raw array buffer of MVS.
                const arrayBuffer = await createMVSBlob(
                    defaultMVSData.data,
                ).arrayBuffer();

                // Save MVS into file.
                const saveDataResult = await window.electron.saveTemporaryData(
                    arrayBuffer,
                    path,
                );

                // TODO: report an error
                if (!saveDataResult) {
                    console.log("Default MVS could not be saved!");
                    return;
                }

                // Show processed volume data as MVS in viewer.
                const loadResult = await loadFromFile({
                    path: "",
                    extension: defaultMVSData.extension,
                    name: "",
                    binary: defaultMVSData.isBinary,
                    content: defaultMVSData.data,
                });

                if (!loadResult) {
                    console.log("Default MVS could not be loaded!");
                    return;
                }

                // Sets regime to "viewing".
                setRegime({
                    kind: "viewing",
                    fileToView: {
                        path: path, // TODO: does this matter? I am not sure if path is whole path or without filename
                        extension: defaultMVSData.extension,
                        name: "tmp",
                        binary: defaultMVSData.isBinary,
                        content: defaultMVSData.data,
                    },
                    deconstructedFile: {
                        assets: assets ?? [],
                    },
                    stateTree: loadResult.stateTree,
                });
            },
            onError: (err) => {
                console.log(`Processing failed: ${err.message}`);
            },
        });
    }, [regime, setVolumes, setRegime]);

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
                <SceneManager
                    isMolstarExpanded={molstarExpanded}
                    views={views}
                    setViews={setViews}
                ></SceneManager>
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

function createEditRootMenuItem(
    t: TFunction<"translation", undefined>,
    stateTree: MVSData | undefined,
    views: ViewMetadata[],
    setViews: Dispatch<SetStateAction<ViewMetadata[]>>,
    assets: FileData[],
) {
    const clearViewerItem: MenuItem = {
        id: "clear-viewer",
        title: t("menu.pageSpecific.viewer.Clear viewer"),
        icon: { icon: BroomIcon, position: "left" },
        task: {
            action: () => {
                clearViewer();
                setViews(() => []);
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
                // exportViewsAsMVSStory(views, assets);
                if (stateTree) exportStateTree(stateTree, assets);
            },
            type: "direct",
        },
    };

    const loadDefaultPDBItem: MenuItem = {
        id: "load-default-pdb",
        title: "Load default PDB",
        task: {
            action: () => {
                loadDefaultPDBFile();
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
            loadDefaultPDBItem,
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
async function loadDefaultMVSJFile() {
    const response = await fetch(
        "https://raw.githubusercontent.com/molstar/molstar/master/examples/mvs/1cbs.mvsj",
    );
    const rawData = await response.text();

    await loadFromFile({
        path: "",
        extension: "mvsj",
        name: "1cbs",
        binary: false,
        content: rawData,
    });
}

async function loadDefaultMVSXFile() {
    const response = await fetch(
        "https://molstar.org/mol-view-spec-docs/files/1h9t.mvsx",
    );
    const arrayBuffer = await response.arrayBuffer();
    const rawData = new Uint8Array(arrayBuffer);

    await loadFromFile({
        path: "",
        extension: "mvsx",
        name: "1h9t",
        binary: true,
        content: rawData,
    });
}
async function loadDefaultPDBFile() {
    const response = await fetch("https://files.rcsb.org/download/3PTB.pdb");
    const rawData = await response.text();

    await loadFromFile({
        path: "",
        extension: "pdb",
        name: "3PTB",
        binary: false,
        content: rawData,
    });
}
