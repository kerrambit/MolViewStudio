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
import type { Regime } from "../providers/RegimeProvider";
import { ShowMVSTreeDialogueContent } from "../features/viewer/components/ShowMVSTreeDialogueContent";
import {
    loadDefaultMVSJFile,
    loadDefaultMVSXFile,
    loadDefaultPDBFile,
} from "../features/viewer/services/defaultLoaderService";

export function createInitialMenuForViewerPageMenu(
    navigate: NavigateFunction,
    showDialogue: ShowDialogueType,
    openFileExplorerAndLoadFileInApp: () => Promise<void>,
    createNewProjectInApp: () => void,
    loadRecentFileInApp: (path: string) => Promise<void>,
    clearAssets: () => void,
    getAllAssets: () => ManagedAsset[],
    getAllLocalAssets: () => ManagedAsset[],
    regime: Regime,
    setRegime: (regime: Regime) => void,
): Menu {
    return [
        createFileRootMenuItem([
            createProjectActionsSection([
                createCreateNewProjectMenuItem(() => {
                    createNewProjectInApp();
                }),
            ]),
            createFileImportSection([
                createOpenFileInViewerMenuItem(() =>
                    openFileExplorerAndLoadFileInApp(),
                ),
                createOpenRecentFileInViewerMenuItem(async (path: string) => {
                    await loadRecentFileInApp(path);
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
            createExitSection([createExitMenuItem()]),
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
                        clearAssets();
                        await clearViewer();
                        setRegime({
                            kind: "idling",
                        });
                    }
                }),
                createExportViwerMenuItem(async () => {
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
                }),
                createShowRawMVSTreeItemMenuItem(async () => {
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
                    loadDefaultPDBFile(setRegime);
                }),
                createLoadDefaultMVSJtemMenuItem(async () => {
                    loadDefaultMVSJFile(setRegime);
                }),
                createLoadDefaultMVSXtemMenuItem(async () => {
                    loadDefaultMVSXFile(setRegime);
                }),
            ]),
        ]),
        createSettingsRootMenuItem(navigate),
        createHelpRootMenuItem([
            createHomePageSection([
                createHomePageMenuItem(() => {
                    navigate("/home");
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
