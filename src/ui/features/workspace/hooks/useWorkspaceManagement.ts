import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MVSFilters, StructuralFilters } from "../../../../types/fileFilters";
import { loggerUi } from "../../../services/UiLoggingService";
import {
    pushErrorNotification,
    pushInfoNotification,
    pushSuccessNotification,
} from "../../../services/NotificationService";
import { useProcessVolume } from "../../../api/hooks/useProcessVolume";
import { useEnvironment } from "../../../hooks/useEnvironment";
import { getFieldFromResponse } from "../../../api/utils/apiParser";
import {
    createBlankMVSDataAsString,
    injectAssetIdsIntoTree,
    loadFromFile,
} from "../../../lib/molstar";
import { useRegimeStore, type Regime } from "../../../stores/regimeStore";
import { useManagedAssetsStore } from "../../../stores/managedAssetsStore";
import { useProcessingStore } from "../../../stores/processingStore";
import { useRecentFilesStore } from "../../../stores/recentFilesStore";

export function useWorkspaceManagement() {
    // Use navigate,
    const navigate = useNavigate();

    // Use environment.
    const env = useEnvironment();

    // Use recent files.
    const addRecentFile = useRecentFilesStore((state) => state.addRecentFile);

    // Use processing.
    const startJob = useProcessingStore((state) => state.startJob);
    const completeJob = useProcessingStore((state) => state.completeJob);
    const failJob = useProcessingStore((state) => state.failJob);
    const processVolume = useProcessVolume();

    const loadFileInApp = useCallback(
        async (fileData: FileData[] | Error) => {
            if (!(fileData instanceof Error)) {
                if (fileData.length > 0) {
                    // Add recent file.
                    addRecentFile(fileData[0].path);

                    loggerUi.info(`File <${fileData[0].path}> was selected.`);

                    // Set regime to `staging`.
                    const regime: Regime = {
                        kind: "staging",
                        fileToView: fileData[0],
                    };
                    useRegimeStore.getState().setRegime(regime);

                    // Navigate to viewer page.
                    navigate("/viewer");
                }
            } else {
                loggerUi.error(`Error occured: <${fileData.message}>!`);
                pushErrorNotification(
                    `Error occured! Details: {${fileData.message}}.`,
                );
            }
        },
        [addRecentFile, navigate],
    );

    const openFileInViewer = useCallback(async () => {
        // Open file in viewer only if the regime is in `staging` and therefore we know we have data to open in a viewer.
        const regime = useRegimeStore.getState().regime;
        if (regime.kind !== "staging") {
            return;
        }

        // Import started.
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
            useManagedAssetsStore.getState().clearAssets();
            pushInfoNotification(
                "No views were found for this type of file. You can only view structure in the Molstar viewer. You cannot create views or export data. Try to load valid MVS file next time.",
            );
            return;
        }

        // Clears all managed assets and then register local assets in ManagedAssetsProvider.
        useManagedAssetsStore.getState().clearAssets();
        result.assets.forEach((a) => {
            useManagedAssetsStore.getState().addAsset(a);
        });

        // Replace existing local relative paths or remote links with an ID of inserted managed asset in all views.
        const stateTree = injectAssetIdsIntoTree(
            result.stateTree,
            result.assets,
        );

        // Set the regime with new assets and state tree.
        useRegimeStore.getState().setRegime({
            ...regime,
            kind: "viewing",
            stateTree: stateTree,
            sourceUrl: result.sourceUrl,
        });

        // Import ended.
        pushSuccessNotification("Import ended!");
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

    const processFile = useCallback(
        async (fileToProcess: FileData, newRelativePath: string) => {
            // Start processing job.
            const jobId = startJob(fileToProcess);

            // Define temporary directory for processing of volumetric data.
            const processingID = `${new Date().toISOString().replace(/:/g, "-")}`;
            const temporaryDirectory = `${env.userDataPath}/Processing/${processingID}/RawData`;

            // Call async API endpoint.
            processVolume.mutate(
                {
                    filepath: fileToProcess.path,
                    temporaryDirectory: temporaryDirectory,
                },
                {
                    onSuccess: async (response) => {
                        // Parse string array containing absolute paths.
                        let absolutePaths: string[] = [];
                        try {
                            absolutePaths = await getFieldFromResponse<
                                string[]
                            >(response, "output_files", "object");
                        } catch (error) {
                            pushErrorNotification(
                                `An internal error occurred! For more information, see the logs or open an issue at https://github.com/kerrambit/MolStarApp.`,
                            );
                            loggerUi.error(
                                `Internal error. Unable to parse the response: <${error}>!`,
                            );
                            return;
                        }

                        loggerUi.info(
                            `Processing outputted these raw files: [${absolutePaths}].`,
                        );

                        // Job is completed.
                        completeJob(jobId, absolutePaths);

                        // Read assets from processed volume file.
                        const assets =
                            await window.electron.getFileData(absolutePaths);

                        if (assets instanceof Error) {
                            pushErrorNotification(
                                `Application was not able to read processed assets! For more information, see the logs.`,
                            );
                            loggerUi.error(
                                `Unable to read these assets [${absolutePaths}] from processed volume! Details: <${assets.message}>.`,
                            );
                            return;
                        }

                        assets.map((asset) => {
                            // Adds local asset into asset manager.
                            const wasSuccessful = useManagedAssetsStore
                                .getState()
                                .addLocalAsset(asset, newRelativePath);

                            if (!wasSuccessful) {
                                pushErrorNotification(
                                    `Asset "${newRelativePath}${asset.name}" already exists!`,
                                );
                            } else {
                                pushSuccessNotification(
                                    `File "${fileToProcess.path}" was successfully processed and new asset "${newRelativePath}${asset.name}" added.`,
                                );
                            }
                        });
                    },
                    onError: (err) => {
                        // Job failed.
                        failJob(jobId, err.message);

                        pushErrorNotification(
                            `Processing of file "${fileToProcess.path}" failed! For more information, see the logs. You might need to restart the application and try processing once more.`,
                        );
                        loggerUi.error(
                            `Processing of file "${fileToProcess.path}" failed! See details: <${err.message}>.`,
                        );
                    },
                },
            );
        },
        [startJob, env.userDataPath, processVolume, completeJob, failJob],
    );

    const createNewProjectInApp = useCallback(() => {
        const fileContentString = createBlankMVSDataAsString();

        const fileData: FileData = {
            path: "",
            extension: "mvsj",
            name: "NewProject.mvsj",
            binary: false,
            content: fileContentString,
        };

        const regime: Regime = {
            kind: "staging",
            fileToView: fileData,
        };

        useRegimeStore.getState().setRegime(regime);

        // Navigate to viewer page.
        navigate("/viewer");
    }, [navigate]);

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

        /**
         * Function processes a file and save it as asset to given relative path. Does not change regime.
         */
        processFile,
    };
}
