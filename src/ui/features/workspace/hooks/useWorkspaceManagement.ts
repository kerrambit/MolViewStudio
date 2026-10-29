/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useCallback } from "react";
import { router } from "../../../router/router";
import { MVSFilters, StructuralFilters } from "../../../../types/fileFilters";
import { loggerUi } from "../../logger/services/UiLoggingService";
import {
    pushErrorNotification,
    pushInfoNotification,
    pushSuccessNotification,
} from "../../notifications/services/NotificationService";
import {
    clearViewer,
    createBlankMVSDataAsString,
    getFileDataFromMolstarAsset,
    injectAssetIdsIntoTree,
    loadFromFile,
} from "../../../lib/molstar";
import { useManagedAssetsStore } from "../../managed-assets/stores/managedAssetsStore";
import { useRecentFilesStore } from "../stores/recentFilesStore";
import { useFileMappingsStore } from "../stores/fileMappingsStore";
import { useRegimeStore } from "../../regime/stores/regimeStore";

export function useWorkspaceManagement() {
    const loadFileInApp = useCallback(async (fileData: FileData[] | Error) => {
        if (!(fileData instanceof Error)) {
            if (fileData.length > 0) {
                // Add recent file.
                useRecentFilesStore.getState().addRecentFile(fileData[0].path);

                // Log the information.
                loggerUi.info(`File <${fileData[0].path}> was selected.`);

                // Stage the file.
                const regime = useRegimeStore.getState().regime;
                if (regime.kind === "idling" || regime.kind === "viewing") {
                    regime.stageFile(fileData[0], true);
                }

                // Navigate to viewer page.
                router.navigate("/viewer");
            }
        } else {
            // Log errors.
            loggerUi.error(`Error occured: <${fileData.message}>!`);
            pushErrorNotification(`Error occured! Details: {${fileData.message}}.`);
        }
    }, []);

    const openFileInViewer = useCallback(async (logImportingInformation: boolean) => {
        // Open file in viewer only if the regime is in `staging` and we know we have data to open in a viewer.
        const regime = useRegimeStore.getState().regime;
        if (regime.kind !== "staging") {
            return;
        }

        // Import started.
        if (logImportingInformation) pushInfoNotification("Import started.");

        // Load the file and handle errors and undefined result.
        const result = await loadFromFile(regime.stagedFile);
        if (result instanceof Error) {
            pushErrorNotification(
                `File "${regime.stagedFile.path}" could not be loaded in the Molstar viewer! Details: "${result.message}".`,
            );
            loggerUi.error(
                `File "${regime.stagedFile.path}" could not be loaded in the Molstar viewer! Details: "${result.message}".`,
            );
            useManagedAssetsStore.getState().clearAssets();
            regime.reset();
            await clearViewer();
            return;
        } else if (result === undefined) {
            pushInfoNotification(
                "No views were found for this type of file. You can only view structure in the Molstar viewer. You cannot create views or export data. Try to load valid MVS file next time.",
            );
            useManagedAssetsStore.getState().clearAssets();
            regime.reset();
            await clearViewer(false);
            return;
        }

        // Clears all managed assets and then register local assets in ManagedAssetsProvider.
        useManagedAssetsStore.getState().clearAssets();
        for (const a of result.assets) {
            useManagedAssetsStore.getState().addAsset(a);

            // Local assets bundled inside the loaded file (e.g. MVSX archive) have no
            // original file on disk: store their data and add the file mapping, so they
            // can be processed/exported later.
            if (a.tag === "local" && typeof a.asset?.url === "string") {
                const data = await getFileDataFromMolstarAsset(a.asset.url);
                if (data) {
                    const resolvedPath = await useFileMappingsStore
                        .getState()
                        .storeMappingFromData(
                            a.id,
                            data.buffer as ArrayBuffer,
                            a.extension,
                        );
                    if (!resolvedPath) {
                        pushErrorNotification(
                            `Failed to store file mapping for asset "${a.name}"! Export and further processing of this asset may not work.`,
                        );
                    }
                }
            }
        }

        // Replace existing local relative paths or remote links with an ID of inserted managed asset in all views.
        const stateTree = injectAssetIdsIntoTree(result.stateTree, result.assets);

        // Set the regime with new assets and state tree.
        regime.viewFile(regime.stagedFile, result.sourceUrl, stateTree);

        // Import ended.
        if (logImportingInformation) pushSuccessNotification("Import ended!");
    }, []);

    const openFileExplorerAndLoadFileInApp = useCallback(async () => {
        // Opends file explorer and let user to choose the file.
        window.electron
            .openFileExplorer(
                false,

                [MVSFilters, StructuralFilters],
            )
            .then((fileData) => {
                loadFileInApp(fileData);
            })
            .catch((error) => {
                pushErrorNotification(`Error occured! Details: {${error}}.`);
                loggerUi.error(`Error occured: <${error}>!`);
            });
    }, [loadFileInApp]);

    const createNewProjectInApp = useCallback(() => {
        // Creates blank MVS of multiple kind.
        const fileContentString = createBlankMVSDataAsString();

        // Mocked FileData object.
        const fileData: FileData = {
            path: "",
            extension: "mvsj",
            name: "NewProject.mvsj",
            binary: false,
            content: fileContentString,
        };

        // Stage the file.
        const regime = useRegimeStore.getState().regime;
        if (regime.kind === "idling" || regime.kind === "viewing") {
            regime.stageFile(fileData, false);
        }

        // Navigate to viewer page.
        router.navigate("/viewer");
    }, []);

    const loadRecentFileInApp = useCallback(
        async (path: string) => {
            const result = await window.electron.getFileData([path]);
            loadFileInApp(result);
        },
        [loadFileInApp],
    );

    return {
        /**
         * Functions moves the `filedata` into regime `staging`. It moves to `/viewer` page automatically.
         */
        loadFileInApp,

        /**
         * Function loads a file via file explorer and moves regime to `staging`. It moves to `/viewer` page automatically.
         */
        openFileExplorerAndLoadFileInApp,

        /**
         * Function creates a blank project (default MVS file) and moves regime into `staging`. It moves to `/viewer` page automatically.
         */
        createNewProjectInApp,

        /**
         * Load recent file into app in regime `staging`. It moves to `/viewer` page automatically.
         */
        loadRecentFileInApp,

        /**
         * Function moves regime from `staging` into `viewing`.
         */
        openFileInViewer,
    };
}
