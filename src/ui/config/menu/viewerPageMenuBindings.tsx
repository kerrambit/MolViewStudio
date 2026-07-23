import { router } from "../../router/router";
import {
    pushErrorNotification,
    pushInfoNotification,
    pushSuccessNotification,
    pushWarningNotification,
} from "../../services/NotificationService";
import { AboutDialogueContent } from "../../features/about-dialogue/components/AboutDialogueContent";
import { ConfirmationDialogueContent } from "../../components/common/dialogue/ConfirmationDialogueContent";
import {
    clearViewer,
    exportStateTree,
    getCurrentViewIndex,
    injectRelativePathsBasedOnAssetIdsIntoTree,
    reloadMolstarAndRestoreIndex,
} from "../../lib/molstar";
import { ShowMVSTreeDialogueContent } from "../../features/viewer/components/ShowMVSTreeDialogueContent";
import {
    loadDefaultMVSJFile,
    loadDefaultMVSXFile,
    loadDefaultPDBFile,
} from "../../features/viewer/services/defaultLoaderService";
import { useRegimeStore } from "../../stores/regimeStore";
import {
    isManagedAssetLocal,
    useManagedAssetsStore,
} from "../../stores/managedAssetsStore";
import { useDialogueStore } from "../../stores/dialogueStore";
import { useWorkspaceManagement } from "../../features/workspace/hooks/useWorkspaceManagement";
import { useRecentFilesStore } from "../../stores/recentFilesStore";
import { IconFileFilled } from "@tabler/icons-react";
import {
    createAboutMenuItem,
    createAboutSection,
    createExitMenuItem,
    createExitSection,
    createFileRootMenuItem,
    createHelpRootMenuItem,
    createOnlyDevSection,
    createOpenDevToolsMenuItem,
} from "./systemMenuItems";
import {
    createEditRootMenuItem,
    createGeneralEditSection,
    createClearViwerMenuItem,
    createExportViwerMenuItem,
    createShowRawMVSTreeItemMenuItem,
    createLoadDefaultPDBItemMenuItem,
    createLoadDefaultMVSJtemMenuItem,
    createLoadDefaultMVSXtemMenuItem,
    createUndoMenuItem,
    createRedoMenuItem,
    createHistorySection,
} from "./editMenuItems";
import {
    createProjectActionsSection,
    createCreateNewProjectMenuItem,
    createFileImportSection,
    createOpenFileInViewerMenuItem,
    createOpenRecentFileInViewerMenuItem,
    createUtilitiesSection,
    createOpenUserDataFolderMenuItem,
} from "./fileMenuItems";
import {
    createHomePageSection,
    createHomePageMenuItem,
    createGeneralHelpSection,
    createMolViewStudioMenuItem,
    createMolstarMenuItem,
    createReportIssueMenuItem,
    createCheckForUpdatesSection,
    createCheckForUpdatesMenuItem,
} from "./helpMenuItems";
import { createSettingsRootMenuItem } from "./settingsRootMenuItem";
import type {
    Menu,
    LiveMenuRenderProps,
    Dropdown,
} from "../../providers/MenuContext";

export function bindViewerMenu(): Menu {
    return [
        createFileRootMenuItem([
            createProjectActionsSection([
                createCreateNewProjectMenuItem(
                    ({ render }: LiveMenuRenderProps) => {
                        const { createNewProjectInApp } =
                            useWorkspaceManagement();

                        return render({
                            action: async () => {
                                const confirmed = await useDialogueStore
                                    .getState()
                                    .showDialogue<boolean>({
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
                            },
                            type: "direct",
                        });
                    },
                ),
            ]),
            createFileImportSection([
                createOpenFileInViewerMenuItem(
                    ({ render }: LiveMenuRenderProps) => {
                        const { openFileExplorerAndLoadFileInApp } =
                            useWorkspaceManagement();
                        return render({
                            action: async () => {
                                const confirmed = await useDialogueStore
                                    .getState()
                                    .showDialogue<boolean>({
                                        title: "Confirmation",
                                        showCloseButton: false,
                                        content: (close) => (
                                            <ConfirmationDialogueContent
                                                close={close}
                                                doYouReallyWantToQuestion="Do you really want to open different file in viewer?"
                                            />
                                        ),
                                    });
                                if (confirmed)
                                    openFileExplorerAndLoadFileInApp();
                            },
                            type: "secondary",
                        });
                    },
                ),
                createOpenRecentFileInViewerMenuItem(
                    ({ render }: LiveMenuRenderProps) => {
                        const { loadRecentFileInApp } =
                            useWorkspaceManagement();

                        const recentFiles =
                            useRecentFilesStore.getState().recentFiles;
                        if (recentFiles.length === 0) return null;

                        const liveDropdownTask: Dropdown = [
                            {
                                id: "recent-files-sub-list",
                                items: recentFiles.map((path) => ({
                                    id: `recent-file-${path}`,
                                    icon: {
                                        icon: IconFileFilled,
                                        position: "left",
                                    },
                                    title: path,
                                    task: {
                                        type: "direct",
                                        action: async () => {
                                            const confirmed =
                                                await useDialogueStore
                                                    .getState()
                                                    .showDialogue<boolean>({
                                                        title: "Confirmation",
                                                        showCloseButton: false,
                                                        content: (close) => (
                                                            <ConfirmationDialogueContent
                                                                close={close}
                                                                doYouReallyWantToQuestion="Do you really want to open different file in viewer?"
                                                            />
                                                        ),
                                                    });
                                            if (confirmed)
                                                await loadRecentFileInApp(path);
                                        },
                                    },
                                })),
                            },
                        ];

                        return render(liveDropdownTask);
                    },
                ),
            ]),
            createUtilitiesSection([
                createOpenUserDataFolderMenuItem(async () => {
                    const result =
                        await window.electron.requestToOpenUserDataFolder();
                    if (result instanceof Error) {
                        pushErrorNotification(
                            `Not able to open user data folder! Details: <${result.message}>.`,
                        );
                    }
                }),
            ]),
            createOnlyDevSection("file-dev", "For developers", [
                createOpenDevToolsMenuItem(),
            ]),
            createExitSection([
                createExitMenuItem(async () => {
                    const confirmed = await useDialogueStore
                        .getState()
                        .showDialogue<boolean>({
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
                }),
            ]),
        ]),
        createEditRootMenuItem([
            createHistorySection([
                createUndoMenuItem(async () => {
                    const regime = useRegimeStore.getState().regime;
                    if (
                        regime.kind === "viewing" ||
                        regime.kind === "restoring"
                    ) {
                        const assets = useManagedAssetsStore.getState().assets;
                        regime.undo();
                        reloadMolstarAndRestoreIndex(
                            undefined,
                            Array.from(assets.values()),
                            regime.history.current(),
                        );
                    }
                }),
                createRedoMenuItem(async () => {
                    const regime = useRegimeStore.getState().regime;
                    if (
                        regime.kind === "viewing" ||
                        regime.kind === "restoring"
                    ) {
                        regime.redo();
                    }
                }),
            ]),
            createGeneralEditSection([
                createClearViwerMenuItem(async () => {
                    const confirmed = await useDialogueStore
                        .getState()
                        .showDialogue<boolean>({
                            title: "Confirmation",
                            showCloseButton: false,
                            content: (close) => (
                                <ConfirmationDialogueContent
                                    close={close}
                                    doYouReallyWantToQuestion="Do you really want to clear the viewer?"
                                />
                            ),
                        });

                    if (confirmed) {
                        useManagedAssetsStore.getState().clearAssets();
                        await clearViewer();
                        useRegimeStore.getState().regime.reset();
                    }
                }),
                createExportViwerMenuItem(async () => {
                    const regime = useRegimeStore.getState().regime;
                    if (regime.kind === "viewing") {
                        pushInfoNotification(`Preparing files for export...`);

                        const result = await exportStateTree(
                            injectRelativePathsBasedOnAssetIdsIntoTree(
                                regime.history.current(),
                                Array.from(
                                    useManagedAssetsStore
                                        .getState()
                                        .assets.values(),
                                ),
                            ),
                            Array.from(
                                useManagedAssetsStore
                                    .getState()
                                    .assets.values(),
                            ).filter(isManagedAssetLocal),
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
                }),
                createShowRawMVSTreeItemMenuItem(async () => {
                    const regime = useRegimeStore.getState().regime;
                    if (regime.kind === "viewing") {
                        await useDialogueStore.getState().showDialogue({
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
                }),
            ]),
            createOnlyDevSection("edit-dev", "For developers", [
                createLoadDefaultPDBItemMenuItem(async () => {
                    const confirmed = await useDialogueStore
                        .getState()
                        .showDialogue<boolean>({
                            title: "Confirmation",
                            showCloseButton: false,
                            content: (close) => (
                                <ConfirmationDialogueContent
                                    close={close}
                                    doYouReallyWantToQuestion="Do you really want to load default PDB file?"
                                />
                            ),
                        });
                    if (confirmed) await loadDefaultPDBFile();
                }),
                createLoadDefaultMVSJtemMenuItem(async () => {
                    const confirmed = await useDialogueStore
                        .getState()
                        .showDialogue<boolean>({
                            title: "Confirmation",
                            showCloseButton: false,
                            content: (close) => (
                                <ConfirmationDialogueContent
                                    close={close}
                                    doYouReallyWantToQuestion="Do you really want to load default MVSJ file?"
                                />
                            ),
                        });
                    if (confirmed) await loadDefaultMVSJFile();
                }),
                createLoadDefaultMVSXtemMenuItem(async () => {
                    const confirmed = await useDialogueStore
                        .getState()
                        .showDialogue<boolean>({
                            title: "Confirmation",
                            showCloseButton: false,
                            content: (close) => (
                                <ConfirmationDialogueContent
                                    close={close}
                                    doYouReallyWantToQuestion="Do you really want to load default MVSX file?"
                                />
                            ),
                        });
                    if (confirmed) await loadDefaultMVSXFile();
                }),
            ]),
        ]),
        createSettingsRootMenuItem(() => {
            router.navigate("/settings");
        }),
        createHelpRootMenuItem([
            createHomePageSection([
                createHomePageMenuItem(async () => {
                    const confirmed = await useDialogueStore
                        .getState()
                        .showDialogue<boolean>({
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
                        router.navigate("/home");
                    }
                }),
            ]),
            createGeneralHelpSection([
                createMolViewStudioMenuItem(),
                createMolstarMenuItem(),
                createReportIssueMenuItem(),
            ]),
            createCheckForUpdatesSection([createCheckForUpdatesMenuItem()]),
            createAboutSection([
                createAboutMenuItem(async () => {
                    await useDialogueStore.getState().showDialogue({
                        title: "About",
                        showCloseButton: true,
                        content: (close) => (
                            <AboutDialogueContent close={close} />
                        ),
                    });
                }),
            ]),
        ]),
    ];
}
