import type { NavigateFunction } from "react-router-dom";
import type { ShowDialogueType } from "../providers/DialogueProvider";
import type { Menu } from "../providers/MenuProvider";
import {
    createAboutMenuItem,
    createAboutSection,
    createCheckForUpdatesMenuItem,
    createCheckForUpdatesSection,
    createClearViwerMenuItem,
    createCreateNewProjectMenuItem,
    createEditRootMenuItem,
    createExitMenuItem,
    createExitSection,
    createExportViwerMenuItem,
    createFileImportSection,
    createFileRootMenuItem,
    createGeneralEditSection,
    createGeneralHelpSection,
    createHelpRootMenuItem,
    createHomePageMenuItem,
    createHomePageSection,
    createLoadDefaultMVSJtemMenuItem,
    createLoadDefaultMVSXtemMenuItem,
    createLoadDefaultPDBItemMenuItem,
    createMolViewStudioMenuItem,
    createMolstarMenuItem,
    createOnlyDevSection,
    createOpenDevToolsMenuItem,
    createOpenFileInViewerMenuItem,
    createOpenRecentFileInViewerMenuItem,
    createOpenUserDataFolderMenuItem,
    createProjectActionsSection,
    createReportIssueMenuItem,
    createSettingsRootMenuItem,
    createShowRawMVSTreeItemMenuItem,
    createUtilitiesSection,
} from "./systemMenuItems";
import {
    pushErrorNotification,
    pushInfoNotification,
    pushSuccessNotification,
    pushWarningNotification,
} from "../services/NotificationService";
import { AboutDialogueContent } from "../features/about-dialogue/components/AboutDialogueContent";
import { ConfirmationDialogueContent } from "../components/common/dialogue/ConfirmationDialogueContent";
import {
    clearViewer,
    exportStateTree,
    injectRelativePathsBasedOnAssetIdsIntoTree,
} from "../lib/molstar";
import { ShowMVSTreeDialogueContent } from "../features/viewer/components/ShowMVSTreeDialogueContent";
import {
    loadDefaultMVSJFile,
    loadDefaultMVSXFile,
    loadDefaultPDBFile,
} from "../features/viewer/services/defaultLoaderService";
import { useRegimeStore } from "../stores/regimeStore";
import {
    isManagedAssetLocal,
    useManagedAssetsStore,
} from "../stores/managedAssetsStore";

export function createInitialMenuForViewerPageMenu(
    navigate: NavigateFunction,
    showDialogue: ShowDialogueType,
    openFileExplorerAndLoadFileInApp: () => Promise<void>,
    createNewProjectInApp: () => void,
    loadRecentFileInApp: (path: string) => Promise<void>,
): Menu {
    return [
        createFileRootMenuItem([
            createProjectActionsSection([
                createCreateNewProjectMenuItem(async () => {
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
                }),
            ]),
            createFileImportSection([
                createOpenFileInViewerMenuItem(async () => {
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
                }),
                createOpenRecentFileInViewerMenuItem(async (path: string) => {
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
                }),
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
                }),
            ]),
        ]),
        createEditRootMenuItem([
            createGeneralEditSection([
                createClearViwerMenuItem(async () => {
                    const confirmed = await showDialogue<boolean>({
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
                        useRegimeStore.getState().setRegime({ kind: "idling" });
                    }
                }),
                createExportViwerMenuItem(async () => {
                    const regime = useRegimeStore.getState().regime;
                    if (regime.kind === "viewing") {
                        pushInfoNotification(`Preparing files for export...`);

                        const result = await exportStateTree(
                            injectRelativePathsBasedOnAssetIdsIntoTree(
                                regime.stateTree,
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
                }),
            ]),
            createOnlyDevSection("edit-dev", "For developers", [
                createLoadDefaultPDBItemMenuItem(async () => {
                    const confirmed = await showDialogue<boolean>({
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
                    const confirmed = await showDialogue<boolean>({
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
                    const confirmed = await showDialogue<boolean>({
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
        createSettingsRootMenuItem(navigate),
        createHelpRootMenuItem([
            createHomePageSection([
                createHomePageMenuItem(async () => {
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
                    await showDialogue({
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
