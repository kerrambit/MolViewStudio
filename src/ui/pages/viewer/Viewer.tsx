import { useEffect, createRef, useState, useRef } from "react";
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
    exportStateTree,
    convertStateTreeFromSingleToMultipleKind,
    serializeMVSXAssets,
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
import { useRegime, type Regime } from "../../services/RegimeProvider";
import { BroomIcon } from "../../components/icons/BroomIcon";
import { Sidebar } from "../../components/common/sidebar/Sidebar";
import { IconPackageExport, IconWorldDownload } from "@tabler/icons-react";
import { useProcessVolume } from "../../hooks/useProcessVolume";
import { getFieldFromResponse } from "../../utils/responseUtils";
import type { Subscription } from "rxjs";
import { SceneManager } from "../../components/scene-manager/SceneManager";
import { useEnvironment } from "../../hooks/useEnvironment";
import { Button } from "../../components/common/button/Button";
import { loggerUi } from "../../utils/loggerUi";
import {
    pushErrorNotification,
    pushInfoNotification,
    pushSuccessNotification,
    pushWarningNotification,
} from "../../services/NotificationService";
import {
    useDialogue,
    type DialogueProps,
} from "../../services/DialogueProvider";
import { ConfirmationDialogueContent } from "../../components/common/dialogue/ConfirmationDialogueContent";
import {
    createExitMenuItem,
    createOnlyDevSection,
    createOpenFileInViewerMenuItem,
    createProcessFileMenuItem,
} from "../../features/menu/systemMenuItems";
import { useFileManagement } from "../../hooks/useFileManagement";

const MOLSTAR_SHOW_CONTROLS = true;
const MOLSTAR_EXPANDED = false;

export function Viewer() {
    // Use localization.
    const { t } = useTranslation();

    // Use environment.
    const env = useEnvironment();

    // Use dialogue.
    const { showDialogue } = useDialogue();

    // Use file management.
    const { loadAndHandleFile } = useFileManagement();

    // TODO: temporary states
    const [volumeSidebarVisible, setVolumeSidebarVisible] = useState(false);
    const [volumes, setVolumes] = useState<string[]>([]);

    // Imports hook for volseg server communication.
    const processVolume = useProcessVolume();

    // Use regime to control the current regime of the application.
    const { regime, setRegime } = useRegime();
    const regimeReference = useRef(regime);
    regimeReference.current = regime;

    // Use menu.
    const {
        deleteRootMenuItem,
        addRootMenuItem,
        replaceMenuItem,
        restoreMenuItem,
    } = useMenu();

    // Update menu for Viewer page.
    useEffect(() => {
        // Create Viewer-specific root menu item.
        const edit = createEditRootMenuItem(t, regime, setRegime, showDialogue);
        addRootMenuItem(edit);

        // Create custom menu items for existing menu items.
        const {
            customExitAction,
            customOpenFileInViewerAction,
            customProcessFileAction,
        } = createCustomMenuItems(showDialogue, loadAndHandleFile);

        // Replace original menu items with custom ones.
        replaceMenuItem("exit", createExitMenuItem(customExitAction));
        replaceMenuItem(
            "open-file-in-viewer",
            createOpenFileInViewerMenuItem(customOpenFileInViewerAction),
        );
        replaceMenuItem(
            "process-file",
            createProcessFileMenuItem(customProcessFileAction),
        );

        return () => {
            // In clean-up, remove page-specific "Edit" root item and restore original menu items.
            deleteRootMenuItem(edit.id);
            restoreMenuItem("exit");
            restoreMenuItem("open-file-in-viewer");
            restoreMenuItem("process-file");
        };
    }, [t, regime]);

    // Controls if Molstar is still in the initialization process.
    const [molstarLoading, setMolstarLoading] = useState(true);

    // Controls if the Molstar viewer is expanded or not.
    const [molstarExpanded, setMolstarExpanded] = useState(MOLSTAR_EXPANDED);

    // Initialize Molstar viewer.
    const parentRef = createRef<HTMLDivElement>();
    useEffect(() => {
        // Subscriptions.
        let fullScreenSubscription: Subscription;

        // Call initializing function.
        initMolstar(
            parentRef.current as HTMLDivElement,
            {
                showControls: MOLSTAR_SHOW_CONTROLS,
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
            if (result === null) {
                pushErrorNotification(
                    `File "${regime.fileToView.path}" could not be loaded in the Molstar viewer!`,
                );
                loggerUi.error(
                    `Error when loading file "${regime.fileToView.path} into the Molstar viewer!"`,
                );
                return;
            } else if (result === undefined) {
                pushInfoNotification(
                    "No views were found for this type of file. You can only view structure in the Molstar viewer. You cannot create views or export data. Try to load valid MVS file next time.",
                );
                return;
            }


            // Set the regime with new assets and state tree.
            setRegime({
                ...regime,
                kind: "viewing",
                views: result.views,
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

function createCustomMenuItems(
    showDialogue: <T = void>(
        options: DialogueProps<T>,
    ) => Promise<T | undefined>,
    loadAndHandleFile: (regimeKind: "viewing" | "processing") => Promise<void>,
) {
    const customExitAction = async () => {
        const confirmed = await showDialogue<boolean>({
            title: "Confirmation",
            showCloseButton: false,
            content: (close) => (
                <ConfirmationDialogueContent
                    close={close}
                    doYouReallyWantToQuestion="Do you really want to exit the application?"
                />
            ),
        });
        if (confirmed) window.electron.requestApplicationExit();
    };

    const customOpenFileInViewerAction = async () => {
        const confirmed = await showDialogue<boolean>({
            title: "Confirmation",
            showCloseButton: false,
            content: (close) => (
                <ConfirmationDialogueContent
                    close={close}
                    doYouReallyWantToQuestion="Do you really want to open different file in viewer?"
                />
            ),
        });
        if (confirmed) loadAndHandleFile("viewing");
    };

    const customProcessFileAction = async () => {
        const confirmed = await showDialogue<boolean>({
            title: "Confirmation",
            showCloseButton: false,
            content: (close) => (
                <ConfirmationDialogueContent
                    close={close}
                    doYouReallyWantToQuestion="Do you really want to process new file?"
                />
            ),
        });
        if (confirmed) loadAndHandleFile("processing");
    };

    return {
        customExitAction,
        customOpenFileInViewerAction,
        customProcessFileAction,
    };
}

function createEditRootMenuItem(
    t: TranslateFunction,
    regime: Regime,
    setRegime: (regime: Regime) => void,
    showDialogue: <T = void>(
        options: DialogueProps<T>,
    ) => Promise<T | undefined>,
) {
    const clearViewerItem: MenuItem = {
        id: "clear-viewer",
        title: t("menu.pageSpecific.viewer.Clear viewer"),
        icon: { icon: BroomIcon, position: "left" },
        task: {
            action: async () => {
                const confirmed = await showDialogue<boolean>({
                    title: "Confirmation",
                    showCloseButton: false,
                    content: (close) => (
                        <ConfirmationDialogueContent
                            close={close}
                            doYouReallyWantToQuestion="Do you really want to clear the
                viewer?"
                        />
                    ),
                });

                if (confirmed === true) {
                    clearViewer();
                    setRegime({
                        kind: "idling",
                    });
                }
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
                if (regime.kind === "viewing") {
                    pushInfoNotification(`Export started.`);
                    await exportStateTree(
                        regime.stateTree,
                    );
                    pushSuccessNotification(`Export finished!`);
                } else {
                    pushWarningNotification(
                        `Export is not possible now! You are probably still processing data or you are viewing non-MVS file.`,
                    );
                }
            },
            type: "direct",
        },
    };

    const loadDefaultPDBItem: MenuItem = {
        id: "load-default-pdb",
        icon: { icon: IconWorldDownload, position: "left" },
        title: "Load default PDB",
        task: {
            action: () => {
                loadDefaultPDBFile(setRegime);
            },
            type: "direct",
        },
    };

    const loadDefaultMVSJItem: MenuItem = {
        id: "load-default-mvsj",
        icon: { icon: IconWorldDownload, position: "left" },
        title: "Load default MVSJ",
        task: {
            action: () => {
                loadDefaultMVSJFile(setRegime);
            },
            type: "direct",
        },
    };

    const loadDefaultMVSXItem: MenuItem = {
        id: "load-default-mvsx",
        icon: { icon: IconWorldDownload, position: "left" },
        title: "Load default MVSX",
        task: {
            action: () => {
                loadDefaultMVSXFile(setRegime);
            },
            type: "direct",
        },
    };

    const section: Section = {
        id: "edit-general",
        items: [clearViewerItem, exportViewerItem],
    };
    const edit: RootMenuItem = {
        id: "edit",
        title: "Edit",
        task: [
            section,
            createOnlyDevSection("edit-dev", "For developers", [
                loadDefaultPDBItem,
                loadDefaultMVSJItem,
                loadDefaultMVSXItem,
            ]),
        ],
        priority: 3,
    };

    return edit;
}
async function loadDefaultMVSJFile(setRegime: (regime: Regime) => void) {
    const response = await fetch(
        "https://raw.githubusercontent.com/molstar/molstar/master/examples/mvs/1cbs.mvsj",
    );
    const rawData = await response.text();

    setRegime({
        kind: "staging",
        fileToView: {
            path: "https://raw.githubusercontent.com/molstar/molstar/master/examples/mvs/1cbs.mvsj",
            extension: "mvsj",
            name: "1cbs.mvsj",
            binary: false,
            content: rawData,
        },
    });
}

async function loadDefaultMVSXFile(setRegime: (regime: Regime) => void) {
    const response = await fetch(
        "https://molstar.org/mol-view-spec-docs/files/1h9t.mvsx",
    );
    const arrayBuffer = await response.arrayBuffer();
    const rawData = new Uint8Array(arrayBuffer);

    setRegime({
        kind: "staging",
        fileToView: {
            path: "https://molstar.org/mol-view-spec-docs/files/1h9t.mvsx",
            extension: "mvsx",
            name: "1h9t.mvsx",
            binary: true,
            content: rawData,
        },
    });
}
async function loadDefaultPDBFile(setRegime: (regime: Regime) => void) {
    const response = await fetch("https://files.rcsb.org/download/3PTB.pdb");
    const rawData = await response.text();

    setRegime({
        kind: "staging",
        fileToView: {
            path: "https://files.rcsb.org/download/3PTB.pdb",
            extension: "pdb",
            name: "3PTB.pdb",
            binary: false,
            content: rawData,
        },
    });
}
