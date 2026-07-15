import type { NavigateFunction } from "react-router-dom";
import type { ShowDialogueType } from "../providers/DialogueProvider";
import type { Menu } from "../providers/MenuProvider";
import {
    createAboutMenuItem,
    createAboutSection,
    createCheckForUpdatesMenuItem,
    createCheckForUpdatesSection,
    createCreateNewProjectMenuItem,
    createExitMenuItem,
    createExitSection,
    createFileImportSection,
    createFileRootMenuItem,
    createGeneralHelpSection,
    createHelpRootMenuItem,
    createHomePageMenuItem,
    createHomePageSection,
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
    createUtilitiesSection,
} from "./systemMenuItems";
import { pushErrorNotification } from "../services/NotificationService";
import { AboutDialogueContent } from "../features/about-dialogue/components/AboutDialogueContent";

export function createInitialMenuForMainMenu(
    navigate: NavigateFunction,
    showDialogue: ShowDialogueType,
    openFileExplorerAndLoadFileInApp: () => Promise<void>,
    createNewProjectInApp: () => void,
    loadRecentFileInApp: (path: string) => Promise<void>,
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
