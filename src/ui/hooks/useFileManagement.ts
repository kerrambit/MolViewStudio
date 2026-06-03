import { useNavigate } from "react-router-dom";
import { useRegime, type Regime } from "../services/RegimeProvider";
import {
    MVSFilters,
    StructuralFilters,
    VolumeFilters,
} from "../../types/fileFilters";
import { loggerUi } from "../utils/loggerUi";
import {
    pushErrorNotification,
    pushSuccessNotification,
} from "../services/NotificationService";
import { useProcessing } from "../services/ProcessingProvider";
import { useProcessVolume } from "./useProcessVolume";
import { useEnvironment } from "./useEnvironment";
import { getFieldFromResponse } from "../utils/responseUtils";
import {
    createDefaultMVSFromLocalFiles,
    createMVSBlob,
} from "../../molstar-wrapper/src";

export function useFileManagement() {
    const navigate = useNavigate();
    const { setRegime } = useRegime();
    // Use environment.
    const env = useEnvironment();
    const { startJob, completeJob, failJob } = useProcessing();
    const processVolume = useProcessVolume();

    const loadAndHandleFile = async (
        handleFileAs: "processing" | "viewing",
    ) => {
        window.electron
            .openFileExplorer(
                false,
                handleFileAs === "processing"
                    ? [VolumeFilters]
                    : [MVSFilters, StructuralFilters],
            )
            .then((fileData) => {
                handleFile(handleFileAs, fileData);
            })
            .catch((error) => {
                pushErrorNotification(`Error occured! Details: {${error}}.`);
                loggerUi.error(`Error occured: <${error}>!`);
            });
    };

    const handleFile = async (
        handleFileAs: "processing" | "viewing",
        fileData: FileData[] | Error,
    ) => {
        if (!(fileData instanceof Error)) {
            if (fileData.length > 0) {
                loggerUi.info(`File <${fileData[0].path}> was selected.`);

                if (handleFileAs === "processing") {
                    // Get file data.
                    const fileToProcess = fileData[0];

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
                                    await window.electron.getFileData(
                                        absolutePaths,
                                    );

                                if (assets instanceof Error) {
                                    pushErrorNotification(
                                        `Application was not able to read processed assets! For more information, see the logs.`,
                                    );
                                    loggerUi.error(
                                        `Unable to read these assets [${absolutePaths}] from processed volume! Details: <${assets.message}>.`,
                                    );
                                    return;
                                }

                                // Create MVS bundle from assets, containing just default view.
                                const defaultMVSData =
                                    await createDefaultMVSFromLocalFiles(
                                        assets,
                                        `Processed file <${fileToProcess.name}>`,
                                    );

                                // Path for temporary MVS processed file.
                                const path = `${`Processing/${processingID}/MVS/export`}.${
                                    defaultMVSData.extension
                                }`;

                                // Create raw array buffer of MVS.
                                const arrayBuffer = await createMVSBlob(
                                    defaultMVSData.data,
                                ).arrayBuffer();

                                // Save MVS into file.
                                const saveDataResult =
                                    await window.electron.saveTemporaryData(
                                        arrayBuffer,
                                        path,
                                    );

                                if (saveDataResult instanceof Error) {
                                    loggerUi.error(
                                        `Default MVS could not be saved! Details: <${saveDataResult.message}>.`,
                                    );
                                    return;
                                }

                                pushSuccessNotification(
                                    `File "${fileToProcess.path}" was successfully processed.`,
                                );

                                // Sets regime to "staging".
                                setRegime({
                                    kind: "staging",
                                    fileToView: {
                                        path: path,
                                        extension: defaultMVSData.extension,
                                        name: `export.${defaultMVSData.extension}`,
                                        binary: defaultMVSData.isBinary,
                                        content: defaultMVSData.data,
                                    },
                                });
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

                    // Navigate to viewer page.
                    navigate("/viewer");
                } else {
                    const regime: Regime = {
                        kind: "staging",
                        fileToView: fileData[0],
                    };
                    setRegime(regime);

                    // Navigate to viewer page.
                    navigate("/viewer");
                }
            }
        } else {
            loggerUi.error(`Error occured: <${fileData.message}>!`);
            pushErrorNotification(
                `Error occured! Details: {${fileData.message}}.`,
            );
        }
    };

    return { loadAndHandleFile, handleFile };
}
