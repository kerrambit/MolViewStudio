import { router } from "../../router/router";
import { pushErrorNotification } from "../../services/NotificationService";
import { AboutDialogueContent } from "../../features/about-dialogue/components/AboutDialogueContent";
import { useDialogueStore } from "../../stores/dialogueStore";
import { useWorkspaceManagement } from "../../features/workspace/hooks/useWorkspaceManagement";
import { IconFileFilled } from "@tabler/icons-react";
import { useRecentFilesStore } from "../../stores/recentFilesStore";
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

export function bindMainMenu(): Menu {
    return [
        createFileRootMenuItem([
            createProjectActionsSection([
                createCreateNewProjectMenuItem(
                    ({ render }: LiveMenuRenderProps) => {
                        const { createNewProjectInApp } =
                            useWorkspaceManagement();

                        return render({
                            action: () => {
                                createNewProjectInApp();
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
                                await openFileExplorerAndLoadFileInApp();
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
            createExitSection([createExitMenuItem()]),
        ]),
        createSettingsRootMenuItem(() => {
            router.navigate("/settings");
        }),
        createHelpRootMenuItem([
            createHomePageSection([
                createHomePageMenuItem(() => {
                    router.navigate("/home");
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
