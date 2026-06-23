import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
    useDialogue,
    type ShowDialogueType,
} from "../../../providers/DialogueProvider";
import { useRegime, type Regime } from "../../../providers/RegimeProvider";
import { useWorkspaceManagement } from "../../workspace/hooks/useWorkspaceManagement";
import { useManagedAssets } from "../../../providers/ManagedAssetsProvider";
import {
    useMenu,
    type MenuItem,
    type RootMenuItem,
    type Section,
} from "../../../providers/MenuProvider";
import {
    createCreateNewProjectMenuItem,
    createExitMenuItem,
    createHomePageMenuItem,
    createOnlyDevSection,
    createOpenFileInViewerMenuItem,
    createOpenRecentFileInViewerMenuItem,
} from "../../../config/systemMenuItems";
import { ConfirmationDialogueContent } from "../../../components/common/dialogue/ConfirmationDialogueContent";
import { BroomIcon } from "../../../components/icons/BroomIcon";
import {
    clearViewer,
    exportStateTree,
    injectRelativePathsBasedOnAssetIdsIntoTree,
} from "../../../lib/molstar";
import {
    IconBinaryTreeFilled,
    IconPackageExport,
    IconWorldDownload,
} from "@tabler/icons-react";
import {
    pushErrorNotification,
    pushInfoNotification,
    pushSuccessNotification,
    pushWarningNotification,
} from "../../../services/NotificationService";
import { ShowMVSTreeDialogueContent } from "../components/ShowMVSTreeDialogueContent";
import {
    loadDefaultMVSJFile,
    loadDefaultMVSXFile,
    loadDefaultPDBFile,
} from "../services/defaultLoaderService";
import { useNavigate, type NavigateFunction } from "react-router-dom";

export function useViewerMenu() {
    // Use translation.
    const { t } = useTranslation();

    // Use dialogue.
    const { showDialogue } = useDialogue();

    // Use regime.
    const { regime, setRegime } = useRegime();

    // Use workspace management.
    const {
        openFileExplorerAndLoadFileInApp,
        createNewProjectInApp,
        loadRecentFileInApp,
    } = useWorkspaceManagement();

    // Use managed assets.
    const { getAllAssets, getAllLocalAssets, clearAssets } = useManagedAssets();

    // Use menu.
    const {
        addRootMenuItem,
        deleteRootMenuItem,
        replaceMenuItem,
        restoreMenuItem,
    } = useMenu();

    // Use navigation.
    const navigate = useNavigate();

    // For viewer editor, we modify menu.
    useEffect(() => {
        // For viewer editor, show new root menu item "Edit".
        const editMenuItem = createEditRootMenuItem(
            t,
            regime,
            setRegime,
            showDialogue,
            getAllLocalAssets,
            getAllAssets,
            clearAssets,
        );
        addRootMenuItem(editMenuItem);

        // Override behaviour of few system menu items in viewer editor.
        const {
            customExitAction,
            customCreateNewProjectAction,
            customOpenFileInViewerAction,
            customOpenRecentFileInViewerAction,
            customHomePageAction,
        } = createCustomMenuItems(
            showDialogue,
            openFileExplorerAndLoadFileInApp,
            createNewProjectInApp,
            loadRecentFileInApp,
            navigate,
        );

        replaceMenuItem("exit", createExitMenuItem(customExitAction));
        replaceMenuItem(
            "create-new-project",
            createCreateNewProjectMenuItem(customCreateNewProjectAction),
        );
        replaceMenuItem(
            "open-file-in-viewer",
            createOpenFileInViewerMenuItem(customOpenFileInViewerAction),
        );
        replaceMenuItem(
            "recent-file-in-viewer",
            createOpenRecentFileInViewerMenuItem(
                customOpenRecentFileInViewerAction,
            ),
        );
        replaceMenuItem(
            "homepage",
            createHomePageMenuItem(customHomePageAction),
        );

        return () => {
            deleteRootMenuItem(editMenuItem.id);
            restoreMenuItem("exit");
            restoreMenuItem("create-new-project");
            restoreMenuItem("open-file-in-viewer");
            restoreMenuItem("recent-file-in-viewer");
            restoreMenuItem("homepage");
        };
    }, [t, regime, setRegime, showDialogue, getAllLocalAssets, clearAssets]);
}

function createCustomMenuItems(
    showDialogue: ShowDialogueType,
    openFileExplorerAndLoadFileInApp: () => Promise<void>,
    createNewProjectInApp: () => void,
    loadRecentFileInApp: (path: string) => Promise<void>,
    navigate: NavigateFunction,
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

    const customCreateNewProjectAction = async () => {
        const confirmed = await showDialogue<boolean>({
            title: "Confirmation",
            showCloseButton: false,
            content: (close) => (
                <ConfirmationDialogueContent
                    close={close}
                    doYouReallyWantToQuestion="Do you really want to create new project?"
                />
            ),
        });
        if (confirmed) createNewProjectInApp();
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
        if (confirmed) openFileExplorerAndLoadFileInApp();
    };

    const customOpenRecentFileInViewerAction = async (path: string) => {
        const confirmed = await showDialogue<boolean>({
            title: "Confirmation",
            showCloseButton: false,
            content: (close) => (
                <ConfirmationDialogueContent
                    close={close}
                    doYouReallyWantToQuestion="Do you really want to open the recent file in viewer?"
                />
            ),
        });
        if (confirmed) {
            await loadRecentFileInApp(path);
        }
    };

    const customHomePageAction = async () => {
        const confirmed = await showDialogue<boolean>({
            title: "Confirmation",
            showCloseButton: false,
            content: (close) => (
                <ConfirmationDialogueContent
                    close={close}
                    doYouReallyWantToQuestion="Do you really want to leave the viewer and go to home page?"
                />
            ),
        });
        if (confirmed) {
            navigate("/home");
        }
    };

    return {
        customExitAction,
        customCreateNewProjectAction,
        customOpenFileInViewerAction,
        customOpenRecentFileInViewerAction,
        customHomePageAction,
    };
}

function createEditRootMenuItem(
    t: TranslateFunction,
    regime: Regime,
    setRegime: (regime: Regime) => void,
    showDialogue: ShowDialogueType,
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

                if (confirmed) {
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
