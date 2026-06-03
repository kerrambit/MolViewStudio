import { Button } from "../../components/common/button/Button";
import type { FileRejection, FileWithPath } from "@mantine/dropzone";
import { loggerUi } from "../../utils/loggerUi";
import { Dropzone } from "../../components/common/dropzone/Dropzone.tsx";
import {
    pushInfoNotification,
    pushWarningNotification,
} from "../../services/NotificationService.ts";
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
                onDrop={async (files: FileWithPath[]) => {
                    await onDropHandler(files, handleFile);
                }}
                onReject={(rejections: FileRejection[]) => {
                    onRejectHandler(rejections);
                }}
                enableMultipleInputFiles={false}
                allowedExtensions={["map"]} // TODO: disabled all files until https://github.com/kerrambit/MolStarApp/issues/84 is solved
            >
                {renderDropzoneButtonsArea(loadAndHandleFile)}
            </Dropzone>
        </div>
    );
}

// TODO: problem is that this is not unifed with electron/fileDataUtils.ts, see https://github.com/kerrambit/MolStarApp/issues/84
async function onDropHandler(
    files: FileWithPath[],
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
    const file = files[0];
    pushInfoNotification(`[DEV]: <${file.path}>`);

    if (file.path) {
        const result = await window.electron.getFileData([file.path]);
        handleFile("processing", result);
    }
}

function onRejectHandler(rejections: FileRejection[]) {
    loggerUi.warn(
        `Dropzone rejected these files: <${JSON.stringify(rejections)}>.`,
    );
    pushWarningNotification(
        `Dropzone rejected these files: <${JSON.stringify(rejections)}>.`,
    );
    pushWarningNotification(`Dropzone is not implemented at the moment yet!`);
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
