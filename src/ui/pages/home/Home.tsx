import { useNavigate, type NavigateFunction } from "react-router-dom";
import { Button } from "../../components/common/button/Button";
import type { FileRejection, FileWithPath } from "@mantine/dropzone";
import { loggerUi } from "../../utils/loggerUi";
import { Dropzone } from "../../components/common/dropzone/Dropzone.tsx";
import { pushWarningNotification } from "../../services/NotificationService.ts";
import { useRegime, type Regime } from "../../services/RegimeProvider.tsx";
import { useFileManagement } from "../../hooks/useFileManagement.ts";

import "./Home.css";
import "@mantine/core/styles.css";
import "@mantine/dropzone/styles.css";

export default function Home() {
    // TODO: these are temporary until https://github.com/kerrambit/MolStarApp/issues/84 is resolved
    const navigate = useNavigate();
    const { setRegime } = useRegime();
    const actions = { setRegime, navigate };

    // Hook for loading and handling file.
    const { loadAndHandleFile } = useFileManagement();

    return (
        <div className="home">
            <Dropzone
                onDrop={(files: FileWithPath[]) => {
                    onDropHandler(files, actions);
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

// TODO: problem is that this is not unifed with electron/fileDataUtils.ts, see https://github.com/kerrambit/MolStarApp/issues/84
function onDropHandler(
    files: File[],
    actions: {
        setRegime: (regime: Regime) => void;
        navigate: NavigateFunction;
    },
) {
    if (files.length === 0) return;

    loggerUi.info(
        `Dropzone accepted these files: ${files.map(
            (file) => `<${file.name}>`,
        )}. Only the first file will be handled!`,
    );
    const file = files[0];

    const name = file.name;
    const extension = name.includes(".")
        ? name.substring(name.lastIndexOf(".") + 1).toLowerCase()
        : "";
    const path = (file as any).path ?? "";

    const binaryExtensions = ["cvsx", "mvsx"];
    const processableExtensions: string[] = [];

    const isBinary = binaryExtensions.includes(extension);
    const isToProcess = processableExtensions.includes(extension);

    const reader = new FileReader();
    reader.onload = () => {
        const result = reader.result!;

        const fileData: FileData = {
            path,
            extension,
            name,
            binary: isBinary,
            content: isBinary
                ? new Uint8Array(result as ArrayBuffer)
                : (result as string),
        };

        loggerUi.info(
            `Converted file data: <${JSON.stringify({
                name: fileData.name,
                extension: fileData.extension,
                path: fileData.path,
                binary: fileData.binary,
            })}>.`,
        );
        loggerUi.info(
            `Based on file extenstions: <${
                fileData.extension
            }>, the file data regime was set to <${
                isToProcess ? "toProcess" : "toView"
            }>.`,
        );

        let regime: Regime;
        if (isToProcess) {
            regime = { kind: "processing", fileToProcess: fileData };
        } else {
            regime = {
                kind: "staging",
                fileToView: fileData,
            };
        }

        actions.setRegime(regime);
        actions.navigate("/viewer");
    };

    if (isBinary) {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsText(file);
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
    loadAndHandleFile: (regimeKind: "viewing" | "processing") => Promise<void>,
) {
    return (
        <div className="home__buttonsArea">
            <div style={{ pointerEvents: "auto" }}>
                <Button
                    variant="ghost"
                    onClick={() => {
                        dropzoneButtonHandler({
                            label: "Open file in viewer...",
                            regimeKind: "viewing",
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
                            regimeKind: "processing",
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
    regimeKind: "processing" | "viewing";
    loadAndHandleFile: (regimeKind: "viewing" | "processing") => Promise<void>;
}) {
    loggerUi.info(config.label);
    config.loadAndHandleFile(config.regimeKind);
}
