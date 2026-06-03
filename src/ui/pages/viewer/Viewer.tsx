import { createRef, useEffect, useRef, useState } from "react";

import { LoadingOverlay } from "@mantine/core";
import {
    IconBinaryTreeFilled,
    IconPackageExport,
    IconWorldDownload,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { Subscription } from "rxjs";

import {
    clearViewer,
    disposeMolstar,
    exportStateTree,
    getFullScreenSubscription,
    getSnapshot,
    getSnapshotManagerState,
    initMolstar,
    injectAssetIdsIntoTree,
    injectRelativePathsBasedOnAssetIdsIntoTree,
    loadFromFile,
    serializeMVSXAssets,
} from "../../../molstar-wrapper/src";

import {
    useDialogue,
    type DialogueProps,
} from "../../services/DialogueProvider";
import {
    useManagedAssets,
    type ManagedAsset,
} from "../../services/ManagedAssetsProvider";
import {
    useMenu,
    type MenuItem,
    type RootMenuItem,
    type Section,
} from "../../services/MenuProvider";
import {
    pushErrorNotification,
    pushInfoNotification,
    pushSuccessNotification,
    pushWarningNotification,
} from "../../services/NotificationService";
import { useRegime, type Regime } from "../../services/RegimeProvider";

import { useFileManagement } from "../../hooks/useFileManagement";
import { useProcessing } from "../../services/ProcessingProvider";

import {
    createExitMenuItem,
    createOnlyDevSection,
    createOpenFileInViewerMenuItem,
    createProcessFileMenuItem,
} from "../../features/menu/systemMenuItems";

import { Button } from "../../components/common/button/Button";
import { ConfirmationDialogueContent } from "../../components/common/dialogue/ConfirmationDialogueContent";
import { Sidebar } from "../../components/common/sidebar/Sidebar";
import { BroomIcon } from "../../components/icons/BroomIcon";
import { SceneManager } from "../../components/scene-manager/SceneManager";

import { loggerUi } from "../../utils/loggerUi";

import { ShowMVSTreeDialogueContent } from "./ShowMVSTreeDialogueContent";

import "molstar/lib/mol-plugin-ui/skin/light.scss";
import "./Viewer.css";

const MOLSTAR_SHOW_CONTROLS = true;
const MOLSTAR_EXPANDED = false;

export function Viewer() {
    // Use localization.
    const { t } = useTranslation();

    // Use dialogue.
    const { showDialogue } = useDialogue();

    // Use file management.
    const { loadAndHandleFile } = useFileManagement();

    // Use assets.
    const { getAllAssets, getAllLocalAssets, addAsset, clearAssets } =
        useManagedAssets();

    // Use processing.
    const { jobs, clearJob } = useProcessing();

    // Variables for processing sidebar.
    const jobsList = Object.values(jobs);
    const volumeSidebarVisible = jobsList.length > 0;

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
        const edit = createEditRootMenuItem(
            t,
            regime,
            setRegime,
            showDialogue,
            getAllLocalAssets,
            getAllAssets,
            clearAssets,
        );
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
    }, [t, regime, setRegime, showDialogue, getAllLocalAssets, clearAssets]);

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

            pushInfoNotification("Import started.");

            // Load the file.
            const result = await loadFromFile(regime.fileToView);
            if (result instanceof Error) {
                pushErrorNotification(
                    `File "${regime.fileToView.path}" could not be loaded in the Molstar viewer! Details: "${result.message}".`,
                );
                loggerUi.error(
                    `File "${regime.fileToView.path}" could not be loaded in the Molstar viewer! Details: "${result.message}".`,
                );
                return;
            } else if (result === undefined) {
                clearAssets();
                pushInfoNotification(
                    "No views were found for this type of file. You can only view structure in the Molstar viewer. You cannot create views or export data. Try to load valid MVS file next time.",
                );
                return;
            }

            // Clears all managed assets and then register local assets in ManagedAssetsProvider.
            clearAssets();
            result.assets.forEach((a) => {
                addAsset(a);
            });

            // Replace existing local relative paths or remote links with an ID of inserted managed asset in all views.
            const stateTree = injectAssetIdsIntoTree(
                result.stateTree,
                result.assets,
            );

            // Set the regime with new assets and state tree.
            setRegime({
                ...regime,
                kind: "viewing",
                stateTree: stateTree,
                sourceUrl: result.sourceUrl,
            });

            pushSuccessNotification("Import ended!");
        };

        deconstruct();
    }, [regime, setRegime, molstarLoading]);

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
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <h4 style={{ margin: "0 0 10px 0" }}>
                            Processing Jobs
                        </h4>

                        {jobsList.map((job) => (
                            <div
                                key={job.jobId}
                                style={{
                                    border: "1px solid #ccc",
                                    padding: "0.5em",
                                    borderRadius: "6px",
                                    marginBottom: "0.5em",
                                }}
                            >
                                {/* File Name */}
                                <strong>
                                    {job.file?.name || "Processing File..."}
                                </strong>

                                {/* Status Handling */}
                                <div
                                    style={{
                                        margin: "5px 0",
                                        fontSize: "0.9em",
                                    }}
                                >
                                    {job.status === "running" &&
                                        `Processing... ${job.progress}%`}

                                    {job.status === "success" && (
                                        <span style={{ color: "green" }}>
                                            Finished!
                                        </span>
                                    )}

                                    {job.status === "error" && (
                                        <span style={{ color: "red" }}>
                                            Error: {job.errorMessage}
                                        </span>
                                    )}
                                </div>

                                {/* Close/Clear Button */}
                                <Button
                                    size="small"
                                    onClick={() => clearJob(job.jobId)}
                                >
                                    {job.status === "running"
                                        ? "Hide Job"
                                        : "Close"}
                                </Button>
                            </div>
                        ))}
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
    getAllLocalAssets: () => ManagedAsset[],
    getAllAssets: () => ManagedAsset[],
    clearAssets: () => void,
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
                    clearAssets();
                    await clearViewer();
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
                    pushInfoNotification(`Preparing files for export...`);

                    const result = await exportStateTree(
                        injectRelativePathsBasedOnAssetIdsIntoTree(
                            regime.stateTree,
                            getAllAssets(),
                        ),
                        getAllLocalAssets(),
                    );

                    if (result.success) {
                        pushSuccessNotification(`Export ready!`);
                    } else {
                        pushErrorNotification(result.error.message);
                    }
                } else {
                    pushWarningNotification(
                        `Export is currently unavailable! This usually happens if data is still processing, the file format is not supported (non-MVS), or the viewer is empty.`,
                    );
                }
            },
            type: "direct",
        },
    };

    const showRawMVSTreeItem: MenuItem = {
        id: "showRawMVSTree",
        title: "Show raw MVS tree",
        icon: { icon: IconBinaryTreeFilled, position: "left" },
        task: {
            action: async () => {
                if (regime.kind === "viewing") {
                    await showDialogue({
                        title: "MVS Tree",
                        showCloseButton: true,
                        width: "1000px",
                        maxWidth: "1400px",
                        content: (close) => (
                            <ShowMVSTreeDialogueContent close={close} />
                        ),
                    });
                } else {
                    pushWarningNotification(
                        `No current state tree is available. This usually happens if data is still processing, the file format is not supported (non-MVS), or the viewer is empty.`,
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
        items: [clearViewerItem, exportViewerItem, showRawMVSTreeItem],
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
