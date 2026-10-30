/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { router } from "../../../router/router";
import {
    pushErrorNotification,
    pushInfoNotification,
} from "../../notifications/services/NotificationService";
import { useDialogueStore } from "../../dialogue/stores/dialogueStore";
import { IconFileFilled } from "@tabler/icons-react";
import {
    createAboutMenuItem,
    createAboutSection,
    createCheckForUpdatesMenuItem,
    createCheckForUpdatesSection,
    createExitMenuItem,
    createExitSection,
    createFileRootMenuItem,
    createGeneralHelpSection,
    createHelpRootMenuItem,
    createHomePageMenuItem,
    createHomePageSection,
    createOnlyDevSection,
    createOpenDevToolsMenuItem,
    createReportIssueMenuItem,
} from "../../menu/domain/fundamentalMenuItemsAndSections";
import {
    createProjectActionsSection,
    createCreateNewProjectMenuItem,
    createFileImportSection,
    createOpenFileInViewerMenuItem,
    createOpenRecentFileInViewerMenuItem,
    createUtilitiesSection,
    createOpenUserDataFolderMenuItem,
} from "../../menu/domain/fileMenuItems";
import {
    createVolSegStudioMenuItem,
    createMolstarMenuItem,
} from "../../brand/menu/brandMenuItems";
import { createSettingsRootMenuItem } from "../../settings/menu/settingsRootMenuItem";
import type {
    Menu,
    LiveMenuRenderProps,
    Dropdown,
} from "../../menu/providers/MenuContext";
import { AboutDialogueContent } from "../../brand/about-dialogue/components/AboutDialogueContent";
import { useWorkspaceManagement } from "../../workspace/hooks/useWorkspaceManagement";
import { useRecentFilesStore } from "../../workspace/stores/recentFilesStore";

// TODO: implementations of given items has to be in different file, this is a code smell
export function bindMainMenu(): Menu {
    return [
        createFileRootMenuItem([
            createProjectActionsSection([
                createCreateNewProjectMenuItem(({ render }: LiveMenuRenderProps) => {
                    const { createNewProjectInApp } = useWorkspaceManagement();

                    return render({
                        action: () => {
                            createNewProjectInApp();
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
                            await openFileExplorerAndLoadFileInApp();
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
                createVolSegStudioMenuItem(),
                createMolstarMenuItem(),
                createReportIssueMenuItem(
                    "https://github.com/kerrambit/MolStarApp/issues",
                ),
            ]),
            createCheckForUpdatesSection([
                createCheckForUpdatesMenuItem(async () => {
                    pushInfoNotification("Checking for updates...");
                    await window.electron.checkForUpdates();
                }),
            ]),
            createAboutSection([
                createAboutMenuItem(async () => {
                    await useDialogueStore.getState().showDialogue({
                        title: "About",
                        showCloseButton: true,
                        closeOnEscapeEntered: true,
                        content: (close) => <AboutDialogueContent close={close} />,
                    });
                }),
            ]),
        ]),
    ];
}
