import { useNavigate } from "react-router-dom";
import { useRegime, type Regime } from "../../../providers/RegimeProvider";
import { MVSFilters, StructuralFilters } from "../../../../types/fileFilters";
import { loggerUi } from "../../../services/UiLoggingService";
import {
    pushErrorNotification,
    pushInfoNotification,
    pushSuccessNotification,
} from "../../../services/NotificationService";
import { useProcessing } from "../../../providers/ProcessingProvider";
import { useProcessVolume } from "../../../api/hooks/useProcessVolume";
import { useEnvironment } from "../../../hooks/useEnvironment";
import { getFieldFromResponse } from "../../../api/utils/apiParser";
import {
    createBlankMVSDataAsString,
    injectAssetIdsIntoTree,
    loadFromFile,
} from "../../../lib/molstar";
import { useManagedAssets } from "../../../providers/ManagedAssetsProvider";
import { useRecentFiles } from "../../../providers/RecentFilesProvider";

export function useWorkspaceManagement() {
    // Use navigate,
    const navigate = useNavigate();

    // Use regime.
    const { regime, setRegime } = useRegime();

    // Use environment.
    const env = useEnvironment();

    // Use assets.
    const { addAsset, addLocalAsset, clearAssets } = useManagedAssets();

    // Use recent files.
    const { addRecentFile } = useRecentFiles();

    // Use processing.
    const { startJob, completeJob, failJob } = useProcessing();
    const processVolume = useProcessVolume();

    // Function to use to move regime from `staging` into `viewing`.
    const deconstructFile = async () => {
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
            clearAssets();
            pushInfoNotification(
                "No views were found for this type of file. You can only view structure in the Molstar viewer. You cannot create views or export data. Try to load valid MVS file next time.",
            );
            return;
        }

        // Clears all managed assets and then register local assets in ManagedAssetsProvider.
        clearAssets();
        result.assets.forEach((a) => {
            addAsset(a);
        });

        // Replace existing local relative paths or remote links with an ID of inserted managed asset in all views.
        const stateTree = injectAssetIdsIntoTree(
            result.stateTree,
            result.assets,
        );

        // Set the regime with new assets and state tree.
        setRegime({
            ...regime,
            kind: "viewing",
            stateTree: stateTree,
            sourceUrl: result.sourceUrl,
        });

        // Import ended.
        pushSuccessNotification("Import ended!");
    };

    // Function to use to load a file via file explorer and then handle it (as file to process or file to view).
    const loadAndHandleFile = async () => {
        // Opends file explorer and let user to choose the file.
        window.electron
            .openFileExplorer(
                false,

                [MVSFilters, StructuralFilters],
            )
            .then((fileData) => {
                // Handle file.
                handleFile(fileData);
            })
            .catch((error) => {
                pushErrorNotification(`Error occured! Details: {${error}}.`);
                loggerUi.error(`Error occured: <${error}>!`);
            });
    };

    // Function to use to process a file and save it as asset to given relative path. Does not change regime.
    const handleFileAsProcessingOfIndependentAsset = async (
        fileToProcess: FileData,
        newRelativePath: string,
    ) => {
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
                        absolutePaths = await getFieldFromResponse<string[]>(
                            response,
                            "output_files",
                            "object",
                        );
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

                    // Adds local asset into asset manager.
                    const wasSuccessful = addLocalAsset(
                        assets[0],
                        newRelativePath,
                    );

                    if (!wasSuccessful) {
                        pushErrorNotification(
                            `Asset "${newRelativePath}${assets[0].name}" already exists!`,
                        );
                    } else {
                        pushSuccessNotification(
                            `File "${fileToProcess.path}" was successfully processed and new asset "${newRelativePath}${assets[0].name}" added.`,
                        );
                    }
                },
                onError: (err) => {
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
    };

    const handleBlankProject = () => {
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

        setRegime(regime);

        // Navigate to viewer page.
        navigate("/viewer");
    };

    // Handler function which, in case of processing, calls appropriate API call on server to start processing and then moves regime to viewing when data are processed.
    // If user wants to handle file as viewing only, we begin its deconstruction and move regime to viewing.
    const handleFile = async (fileData: FileData[] | Error) => {
        if (!(fileData instanceof Error)) {
            if (fileData.length > 0) {
                // Add recent file.
                addRecentFile(fileData[0].path);

                loggerUi.info(`File <${fileData[0].path}> was selected.`);

                const regime: Regime = {
                    kind: "staging",
                    fileToView: fileData[0],
                };
                setRegime(regime);

                // Navigate to viewer page.
                navigate("/viewer");
            }
        } else {
            loggerUi.error(`Error occured: <${fileData.message}>!`);
            pushErrorNotification(
                `Error occured! Details: {${fileData.message}}.`,
            );
        }
    };

    return {
        loadAndHandleFile,
        handleBlankProject,
        handleFile,
        deconstructFile,
        handleFileAsProcessingOfIndependentAsset,
    };
}
