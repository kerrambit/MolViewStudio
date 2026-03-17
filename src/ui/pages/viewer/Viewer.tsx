import {
    useEffect,
    createRef,
    useState,
    type Dispatch,
    type SetStateAction,
    useRef,
} from "react";
import { useTranslation } from "react-i18next";
import {
    clearViewer,
    initMolstar,
    disposeMolstar,
    loadFromFile,
    getSnapshot,
    createDefaultMVSFromLocalFiles,
    createMVSBlob,
    getFullScreenSubscription,
    type ViewMetadata,
    exportStateTree,
    convertStateTreeFromSingleToMultipleKind,
    serializeMVSXAssets,
    extractViewsFromMVS,
    getSnapshotManagerState,
} from "../../../molstar-wrapper/src";

import "./Viewer.css";
import "molstar/lib/mol-plugin-ui/skin/light.scss";
import { LoadingOverlay } from "@mantine/core";
import {
    useMenu,
    type MenuItem,
    type RootMenuItem,
    type Section,
} from "../../services/MenuProvider";
import type { TFunction } from "i18next";
import { useRegime, type Regime } from "../../services/RegimeProvider";
import { BroomIcon } from "../../components/icons/BroomIcon";
import { Sidebar } from "../../components/common/sidebar/Sidebar";
import { IconPackageExport } from "@tabler/icons-react";
import { useProcessVolume } from "../../hooks/useProcessVolume";
import { getFieldFromResponse } from "../../utils/responseUtils";
import type { Subscription } from "rxjs";
import type { MVSData } from "molstar/lib/extensions/mvs/mvs-data";
import { SceneManager } from "../../components/scene-manager/SceneManager";
import { useEnvironment } from "../../hooks/useEnvironment";
import { Button } from "../../components/common/button/Button";
import { loggerUi } from "../../utils/loggerUi";
import {
    pushErrorNotification,
    pushInfoNotification,
    pushSuccessNotification,
} from "../../services/NotificationService";

const MOLSTAR_EXPANDED = false;

export function Viewer() {
    // Use localization.
    const { t } = useTranslation();

    // Use environment.
    const env = useEnvironment();

    // TODO: temporary state
    const [volumeSidebarVisible, setVolumeSidebarVisible] = useState(false);
    const [volumes, setVolumes] = useState<string[]>([]);

    // Imports hook for volseg server communication.
    const processVolume = useProcessVolume();

    // Controls if Molstar is still in the initialization process.
    const [molstarLoading, setMolstarLoading] = useState(true);

    // Controls if the Molstar viewer is expanded or not.
    const [molstarExpanded, setMolstarExpanded] = useState(MOLSTAR_EXPANDED);

    // Controls current regime of the application, stores current data.
    const { regime, setRegime } = useRegime();
    const regimeReference = useRef(regime);
    regimeReference.current = regime;

    // Current view and views.
    const [views, setViews] = useState<ViewMetadata[]>([]);

    // Add Edit root item button into the menu.
    const { deleteRootMenuItem, addRootMenuItem } = useMenu();
    useEffect(() => {
        const edit = createEditRootMenuItem(
            t,
            regime.kind === "viewing" ? regime.stateTree : undefined,
            setViews,
            regime.kind === "viewing" && regime.deconstructedFile
                ? regime.deconstructedFile.assets
                : [],
            setRegime,
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

        // Call initializing function.
        initMolstar(
            parentRef.current as HTMLDivElement,
            {
                showControls: true,
                isExpanded: MOLSTAR_EXPANDED,
            },
            // If the regime is in "restoring" state, we will supply the initializator the snapshots, assets to fully restore the session.
            regimeReference.current.kind === "restoring"
                ? regimeReference.current.snapshot
                : null,
            regimeReference.current.kind === "restoring"
                ? regimeReference.current.arcpAssets
                : null,
            regimeReference.current.kind === "restoring"
                ? regimeReference.current.snapshotManagerState
                : null,
        ).then(async () => {
            // Molstar is fully initialized.
            setMolstarLoading(false);
            fullScreenSubscription = getFullScreenSubscription((val) => {
                setMolstarExpanded(val);
            });
        });

        return () => {
            // Molstar clean-up procedure.
            const runCleanup = async () => {
                // If the current state is "viewing", and the Molstar is about to be destroyed,
                // we have to save the session to be able to later restore it (in the application lifetime).
                if (regimeReference.current.kind === "viewing") {
                    setRegime({
                        ...regimeReference.current,
                        kind: "restoring",
                        snapshot: getSnapshot(),
                        arcpAssets: await serializeMVSXAssets(),
                        snapshotManagerState: await getSnapshotManagerState(),
                    });
                }

                clearViewer();
                if (fullScreenSubscription)
                    fullScreenSubscription.unsubscribe();
                disposeMolstar();
            };

            // Run async clean-up procedure.
            runCleanup().catch(() => {
                clearViewer();
                if (fullScreenSubscription)
                    fullScreenSubscription.unsubscribe();
                disposeMolstar();
            });
        };
    }, []);

    // Restore the previous workspace.
    useEffect(() => {
        if (molstarLoading || regime.kind !== "restoring") {
            return;
        }

        // Set the views in the editor.
        setViews(extractViewsFromMVS(regime.stateTree));

        // Set the regime back to viewing.
        setRegime({
            ...regime,
            kind: "viewing",
        });
    }, [regime, setRegime, molstarLoading]);

    // Start deconstruction of file to view.
    useEffect(() => {
        const deconstruct = async () => {
            if (molstarLoading || regime.kind !== "staging") {
                return;
            }

            // Load the file.
            const result = await loadFromFile(regime.fileToView);
            if (!result) {
                pushErrorNotification(
                    `File "${regime.fileToView.path}" could not be loaded in the Molstar viewer!`,
                );
                loggerUi.error(
                    `Error when loading file "${regime.fileToView.path} into the Molstar viewer!"`,
                );
                return;
            }

            // Set the views in the editor.
            setViews(result.views);

            // Create an array with local assets (if there are some).
            const assetsArray: FileData[] = Object.entries(
                result.localAssets,
            ).map(([path, data]) => ({
                path: path,
                name: path.split("/").pop() || "",
                content: data,
                extension: (path.split("/").pop() || "").split(".").pop() || "",
                binary: true,
            }));

            // Set the regime with new assets and state tree.
            setRegime({
                ...regime,
                kind: "viewing",
                deconstructedFile: { assets: assetsArray },
                stateTree:
                    result.stateTree.kind === "multiple"
                        ? result.stateTree
                        : convertStateTreeFromSingleToMultipleKind(
                              result.stateTree,
                              {
                                  node: result.stateTree.root,
                                  metadata: result.views[0],
                              },
                          ),
                sourceUrl: result.sourceUrl,
            });
        };

        deconstruct();
    }, [regime, setRegime, molstarLoading]);

    // Start processing of volumetric data.
    useEffect(() => {
        if (regime.kind !== "processing" || !regime.fileToProcess) {
            return;
        }

        setVolumeSidebarVisible(true);

        // Define temporary directory for processing of volumetric data.
        const processingID = `${new Date().toISOString().replace(/:/g, "-")}`;
        const temporaryDirectory = `${env.userDataPath}/Processing/${processingID}/RawData`;

        // Call API endpoint.
        processVolume.mutate(
            {
                filepath: regime.fileToProcess.path,
                temporaryDirectory: temporaryDirectory,
            },
            {
                onSuccess: async (response) => {
                    // Parse string array containing absolute paths.
                    let absolutePaths: string[] = [];
                    try {
                        absolutePaths = await getFieldFromResponse<string[]>(
                            response,
                            "output_files",
                            "object",
                        );
                    } catch (error) {
                        pushErrorNotification(
                            `An internal error occurred! For more information, see the logs or open an issue at https://github.com/kerrambit/MolStarApp.`,
                        );
                        loggerUi.error(
                            `Internal error. Unable to parse the response: <${error}>!`,
                        );
                        return;
                    }

                    loggerUi.info(
                        `Processing outputted these raw files: [${absolutePaths}].`,
                    );

                    setVolumes(absolutePaths);

                    // Read assets from processed volume file.
                    const assets =
                        await window.electron.getFileData(absolutePaths);

                    if (assets instanceof Error) {
                        pushErrorNotification(
                            `Application was not able to read processed assets! For more information, see the logs.`,
                        );
                        loggerUi.error(
                            `Unable to read these assets [${absolutePaths}] from processed volume! Details: <${assets.message}>.`,
                        );
                        return;
                    }

                    // Create MVS bundle from assets, containing just default view.
                    const defaultMVSData = await createDefaultMVSFromLocalFiles(
                        assets,
                        `Processed file <${regime.fileToProcess.name}>`,
                    );

                    // Path for temporary MVS processed file.
                    const path = `${`Processing/${processingID}/MVS/export`}.${
                        defaultMVSData.extension
                    }`;

                    // Create raw array buffer of MVS.
                    const arrayBuffer = await createMVSBlob(
                        defaultMVSData.data,
                    ).arrayBuffer();

                    // Save MVS into file.
                    const saveDataResult =
                        await window.electron.saveTemporaryData(
                            arrayBuffer,
                            path,
                        );

                    if (saveDataResult instanceof Error) {
                        loggerUi.error(
                            `Default MVS could not be saved! Details: <${saveDataResult.message}>.`,
                        );
                        return;
                    }

                    pushSuccessNotification(
                        `File "${regime.fileToProcess.path}" was successfully processed.`,
                    );

                    // Sets regime to "staging".
                    setRegime({
                        kind: "staging",
                        fileToView: {
                            path: path,
                            extension: defaultMVSData.extension,
                            name: "tmp",
                            binary: defaultMVSData.isBinary,
                            content: defaultMVSData.data,
                        },
                    });
                },
                onError: (err) => {
                    pushErrorNotification(
                        `Processing of file "${regime.fileToProcess.path}" failed! For more information, see the logs. You might need to restart the application and try processing once more.`,
                    );
                    loggerUi.error(
                        `Processing of file "${regime.fileToProcess.path}" failed! See details: <${err.message}>.`,
                    );
                },
            },
        );
    }, [regime, setRegime, setVolumes]);

    return (
        <div className="viewer">
            <div className="viewer-content">
                <LoadingOverlay
                    visible={molstarLoading}
                    zIndex={1000}
                    overlayProps={{ radius: "sm", blur: 2 }}
                    loaderProps={{ type: "oval" }}
                />
                {volumeSidebarVisible && (
                    <Sidebar
                        style={{
                            gap: ".5em",
                            padding: ".5em",
                        }}
                    >
                        {processVolume.isPending && "Processing..."}
                        {processVolume.isSuccess &&
                            `Processing finished${volumes.length === 0 ? " with error!" : " succefully: "}${volumes}`}
                        {
                            <Button
                                size="small"
                                onClick={() => {
                                    setVolumeSidebarVisible(false);
                                }}
                            >
                                Close
                            </Button>
                        }
                    </Sidebar>
                )}
                <SceneManager
                    isMolstarExpanded={molstarExpanded}
                    isMolstarLoading={molstarLoading}
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
    setViews: Dispatch<SetStateAction<ViewMetadata[]>>,
    assets: FileData[],
    setRegime: (regime: Regime) => void,
) {
    const clearViewerItem: MenuItem = {
        id: "clear-viewer",
        title: t("menu.pageSpecific.viewer.Clear viewer"),
        icon: { icon: BroomIcon, position: "left" },
        task: {
            action: () => {
                clearViewer();
                setViews(() => []);
                setRegime({
                    kind: "idling",
                });
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
                if (stateTree) await exportStateTree(stateTree, assets);
                pushInfoNotification(`Export finished!`);
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
