import { Button } from "../../components/common/button/Button";
import type { FileRejection } from "@mantine/dropzone";
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
                getFilesFromEvent={(event: any) => {
                    let rawFiles: any[] = [];

                    if (event.dataTransfer && event.dataTransfer.files) {
                        rawFiles = Array.from(event.dataTransfer.files);
                    } else if (event.target && event.target.files) {
                        rawFiles = Array.from(event.target.files);
                    }

                    rawFiles.forEach((file) => {
                        Object.defineProperty(file, "realPath", {
                            value: file.path,
                            writable: false,
                        });
                    });

                    return Promise.resolve(rawFiles);
                }}
                onDrop={async (files: File[]) => {
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

interface ElectronFile extends File {
    realPath: string;
}

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

    const file = files[0] as ElectronFile;

    loggerUi.info("RAW FILE OBJECT:", file);

    // 2. Let's see if the property is hiding under a different web standard name
    loggerUi.info("WEBKIT RELATIVE PATH:", file.realPath);

    pushInfoNotification(`[DEV]: <${file.realPath}>`);

    if (file.realPath) {
        const result = await window.electron.getFileData([file.realPath]);
        handleFile("processing", result);
    }
}

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
