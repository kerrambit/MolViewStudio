/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { router } from "../../router/router";
import {
    pushErrorNotification,
    pushWarningNotification,
} from "../../services/NotificationService";
import { AboutDialogueContent } from "../../features/about-dialogue/components/AboutDialogueContent";
import { ConfirmationDialogueContent } from "../../components/common/dialogue/ConfirmationDialogueContent";
import { clearViewer, reloadMolstarAndRestoreIndex } from "../../lib/molstar";
import { ShowMVSTreeDialogueContent } from "../../features/viewer/components/ShowMVSTreeDialogueContent";
import {
    loadDefaultMVSJFile,
    loadDefaultMVSXFile,
    loadDefaultPDBFile,
} from "../../features/viewer/services/defaultLoaderService";
import { useRegimeStore } from "../../stores/regimeStore";
import { useManagedAssetsStore } from "../../stores/managedAssetsStore";
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
    createClearViwerMenuItem,
    createExportViwerMenuItem,
    createShowRawMVSTreeItemMenuItem,
    createLoadDefaultPDBItemMenuItem,
    createLoadDefaultMVSJtemMenuItem,
    createLoadDefaultMVSXtemMenuItem,
    createUndoMenuItem,
    createRedoMenuItem,
    createHistorySection,
    createShowSourceTreeHistoryMenuItem,
    createViewerSection,
    createExportSection,
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
    createGeneralWindowsActionsSection,
    createToggleProcessingJobsItem,
    createToggleSceneManagerItem,
    createWindowsRootMenuItem,
} from "./windowsMenuItems";
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
import type { Menu, LiveMenuRenderProps, Dropdown } from "../../providers/MenuContext";
import { useProcessingStore } from "../../features/processing/stores/processingStore";
import { ShowSourceTreeHistoryDialogueContent } from "../../features/viewer/components/ShowSourceTreeHistoryDialogueContent";
import { useWindowsStore } from "../../features/viewer/stores/WindowsStore";
import { runExportFlow } from "../../features/viewer/export/services/exportService";
import { useExportStore } from "../../features/viewer/export/stores/exportStore";
import { useStartFileProcessingForExport } from "../../features/processing/export/hooks/useStartFileProcessingForExport";

export function bindViewerMenu(): Menu {
    return [
        createFileRootMenuItem([
            createProjectActionsSection([
                createCreateNewProjectMenuItem(({ render }: LiveMenuRenderProps) => {
                    const { createNewProjectInApp } = useWorkspaceManagement();

                    return render({
                        action: async () => {
                            if (useExportStore.getState().status === "processing") {
                                pushWarningNotification(
                                    "New project cannot be created as export is running. Try once again after export is finished.",
                                );
                                return;
                            }

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

                            if (confirmed) {
                                useManagedAssetsStore.getState().clearAssets();
                                useProcessingStore.getState().clearAllJobs();
                                useRegimeStore.getState().regime.reset();
                                await clearViewer();

                                createNewProjectInApp();
                            }
                        },
                        type: "direct",
                    });
                }),
            ]),
            createFileImportSection([
                createOpenFileInViewerMenuItem(({ render }: LiveMenuRenderProps) => {
                    const { openFileExplorerAndLoadFileInApp } = useWorkspaceManagement();

                    return render({
                        action: async () => {
                            if (useExportStore.getState().status === "processing") {
                                pushWarningNotification(
                                    "File cannot be opened as export is running. Try once again after export is finished.",
                                );
                                return;
                            }

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
                            if (confirmed) {
                                useManagedAssetsStore.getState().clearAssets();
                                useProcessingStore.getState().clearAllJobs();
                                useRegimeStore.getState().regime.reset();
                                await clearViewer();

                                openFileExplorerAndLoadFileInApp();
                            }
                        },
                        type: "secondary",
                    });
                }),
                createOpenRecentFileInViewerMenuItem(
                    ({ render }: LiveMenuRenderProps) => {
                        const { loadRecentFileInApp } = useWorkspaceManagement();

                        const recentFiles = useRecentFilesStore.getState().recentFiles;
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
                                            if (
                                                useExportStore.getState().status ===
                                                "processing"
                                            ) {
                                                pushWarningNotification(
                                                    "File cannot be opened as export is running. Try once again after export is finished.",
                                                );
                                                return;
                                            }

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
                                            if (confirmed) {
                                                useManagedAssetsStore
                                                    .getState()
                                                    .clearAssets();
                                                useProcessingStore
                                                    .getState()
                                                    .clearAllJobs();
                                                useRegimeStore.getState().regime.reset();
                                                await clearViewer();

                                                await loadRecentFileInApp(path);
                                            }
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
                    const result = await window.electron.requestToOpenUserDataFolder();
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
        createWindowsRootMenuItem([
            createGeneralWindowsActionsSection([
                createToggleSceneManagerItem(() => {
                    const regime = useRegimeStore.getState().regime;
                    if (regime.kind === "idling") {
                        pushWarningNotification(
                            "Nothing to show! File format is not supported (non-MVS), or the viewer is empty.",
                        );
                    }
                    useWindowsStore.getState().toggleWindow("scene-manager");
                }),
                createToggleProcessingJobsItem(() => {
                    useWindowsStore.getState().toggleWindow("processing-jobs");
                }),
            ]),
        ]),
        createEditRootMenuItem([
            createHistorySection([
                createUndoMenuItem(async () => {
                    const initialRegime = useRegimeStore.getState().regime;
                    if (
                        initialRegime.kind !== "viewing" &&
                        initialRegime.kind !== "restoring"
                    ) {
                        return;
                    }

                    initialRegime.undo();

                    const updatedRegime = useRegimeStore.getState().regime;
                    if (
                        updatedRegime.kind !== "viewing" &&
                        updatedRegime.kind !== "restoring"
                    ) {
                        return;
                    }

                    // Synchronization with managed assets.
                    useManagedAssetsStore
                        .getState()
                        .setAssetUseCounts(
                            updatedRegime.history.current().assetsUseCounts,
                        );

                    await reloadMolstarAndRestoreIndex(
                        {
                            index: updatedRegime.history.current().viewIndex || 0,
                        },
                        Array.from(useManagedAssetsStore.getState().assets.values()),
                        updatedRegime.history.current().stateTree,
                    );
                }),
                createRedoMenuItem(async () => {
                    const initialRegime = useRegimeStore.getState().regime;
                    if (
                        initialRegime.kind !== "viewing" &&
                        initialRegime.kind !== "restoring"
                    )
                        return;

                    initialRegime.redo();

                    const updatedRegime = useRegimeStore.getState().regime;
                    if (
                        updatedRegime.kind !== "viewing" &&
                        updatedRegime.kind !== "restoring"
                    )
                        return;

                    // Synchronization with managed assets.
                    useManagedAssetsStore
                        .getState()
                        .setAssetUseCounts(
                            updatedRegime.history.current().assetsUseCounts,
                        );

                    await reloadMolstarAndRestoreIndex(
                        {
                            index: updatedRegime.history.current().viewIndex || 0,
                        },
                        Array.from(useManagedAssetsStore.getState().assets.values()),
                        updatedRegime.history.current().stateTree,
                    );
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
            createViewerSection([
                createClearViwerMenuItem(async () => {
                    if (useExportStore.getState().status === "processing") {
                        pushWarningNotification(
                            "Viewer cannot be cleared as export is running! Try once again after export is finished.",
                        );
                        return;
                    }

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
                        useProcessingStore.getState().clearAllJobs();
                        await clearViewer();
                        useRegimeStore.getState().regime.reset();
                    }
                }),
            ]),
            createExportSection([
                createExportViwerMenuItem(({ render }) => {
                    const { startExportProcessing } = useStartFileProcessingForExport();

                    return render({
                        action: async () => {
                            await runExportFlow(startExportProcessing);
                        },
                        type: "direct",
                    });
                }),
            ]),
            createOnlyDevSection("edit-dev", "For developers", [
                createShowSourceTreeHistoryMenuItem(async () => {
                    await useDialogueStore.getState().showDialogue({
                        title: "Source Tree History",
                        showCloseButton: true,
                        width: "1000px",
                        maxWidth: "1400px",
                        content: (close) => (
                            <ShowSourceTreeHistoryDialogueContent close={close} />
                        ),
                    });
                }),
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
                    if (useExportStore.getState().status === "processing") {
                        pushWarningNotification(
                            "Home page cannot be opened as export is running. Try once again after export is finished.",
                        );
                        return;
                    }

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
                        useManagedAssetsStore.getState().clearAssets();
                        useProcessingStore.getState().clearAllJobs();
                        useRegimeStore.getState().regime.reset();
                        await clearViewer();

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
                        content: (close) => <AboutDialogueContent close={close} />,
                    });
                }),
            ]),
        ]),
    ];
}
