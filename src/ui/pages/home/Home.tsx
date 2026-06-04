import { Button } from "../../components/common/button/Button";
import type { FileRejection } from "@mantine/dropzone";
import { loggerUi } from "../../utils/loggerUi";
import { Dropzone } from "../../components/common/dropzone/Dropzone.tsx";
import { pushWarningNotification } from "../../services/NotificationService.ts";
import { useFileManagement } from "../../hooks/useFileManagement.ts";

import "./Home.css";
import "@mantine/core/styles.css";
import "@mantine/dropzone/styles.css";

export default function Home() {
    // Hook for loading and handling file.
    const { loadAndHandleFile, handleFile } = useFileManagement();

    // Render.
    return (
        <div className="home">
            <Dropzone
                onDrop={async (files: File[]) => {
                    await onDropHandler(files, handleFile);
                }}
                onReject={(rejections: FileRejection[]) => {
                    onRejectHandler(rejections);
                }}
                enableMultipleInputFiles={false}
                allowedExtensions={[]} // TODO: disabled all files until https://github.com/kerrambit/MolStarApp/issues/84 is solved
            >
                {renderDropzoneButtonsArea(loadAndHandleFile)}
            </Dropzone>
        </div>
    );
}

// TODO: issue https://github.com/kerrambit/MolStarApp/issues/84
async function onDropHandler(
    files: File[],
    handleFile: (
        handleFileAs: "processing" | "viewing",
        fileData: FileData[] | Error,
    ) => Promise<void>,
) {
    if (files.length === 0) return;

    loggerUi.info(
        `Dropzone accepted these files: ${files.map(
            (file) => `<${file.name}>`,
        )}. Only the first file will be handled!`,
    );

    // TODO: here is the problem we do not have access to full path of `file`
    const result = await window.electron.getFileData([""]);
    handleFile("processing", result);
}

// TODO: issue https://github.com/kerrambit/MolStarApp/issues/84
function onRejectHandler(rejections: FileRejection[]) {
    loggerUi.warn(
        `Dropzone rejected these files: <${JSON.stringify(rejections)}>.`,
    );
    pushWarningNotification(`File was rejected!`);
}

function renderDropzoneButtonsArea(
    loadAndHandleFile: (
        handleFileAs: "viewing" | "processing",
    ) => Promise<void>,
) {
    return (
        <div className="home__buttonsArea">
            <div style={{ pointerEvents: "auto" }}>
                <Button
                    variant="ghost"
                    onClick={() => {
                        dropzoneButtonHandler({
                            label: "Open file in viewer...",
                            handleFileAs: "viewing",
                            loadAndHandleFile,
                        });
                    }}
                >
                    Open file in viewer...
                </Button>
            </div>
            <div style={{ pointerEvents: "auto" }}>
                <Button
                    variant="ghost"
                    onClick={() => {
                        dropzoneButtonHandler({
                            label: "Process file...",
                            handleFileAs: "processing",
                            loadAndHandleFile,
                        });
                    }}
                >
                    Process file...
                </Button>
            </div>
        </div>
    );
}

function dropzoneButtonHandler(config: {
    label: string;
    handleFileAs: "processing" | "viewing";
    loadAndHandleFile: (regimeKind: "viewing" | "processing") => Promise<void>;
}) {
    loggerUi.info(config.label);
    config.loadAndHandleFile(config.handleFileAs);
}
