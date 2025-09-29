import { useNavigate, type NavigateFunction } from "react-router-dom";
import { Dropzone } from "../../components/common/dropzone/Dropzone";
import { Button } from "../../components/common/button/Button";
import type { FileRejection, FileWithPath } from "@mantine/dropzone";
import { useFileData, type FileRegime } from "../../services/FileDataProvider";
import { loggerUi } from "../../utils/loggerUi";

import "./Home.css";
import "@mantine/core/styles.css";
import "@mantine/dropzone/styles.css";

export default function Home() {
    const navigate = useNavigate();
    const { setFileData, setRegime } = useFileData();
    return (
        <div className="home">
            <Dropzone
                onDrop={(files: FileWithPath[]) => {
                    onDropHandler(files, setFileData, setRegime, navigate);
                }}
                onReject={(rejections: FileRejection[]) => {
                    onRejectHandler(rejections);
                }}
                enableMultipleInputFiles={false}
                accept={{
                    "image/png": [".pbd"],
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "1em",
                    }}
                >
                    <div style={{ pointerEvents: "auto" }}>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                loggerUi.info(`Open file in viewer...`);
                                window.electron
                                    .openFileExplorer()
                                    .then((fileData) => {
                                        if (fileData) {
                                            loggerUi.info(
                                                `File <${fileData.path}> was selected.`
                                            );
                                            setFileData(fileData);
                                            setRegime("toView");
                                            navigate("/viewer");
                                        } else {
                                            loggerUi.error(`File was null!`);
                                        }
                                    })
                                    .catch((error) => {
                                        loggerUi.error(`${error}`);
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
                                loggerUi.info(`Process file...`);
                                window.electron
                                    .openFileExplorer()
                                    .then((fileData) => {
                                        if (fileData) {
                                            loggerUi.info(
                                                `File <${fileData.path}> was selected.`
                                            );
                                            setFileData(fileData);
                                            setRegime("toProcess");
                                            navigate("/viewer");
                                        } else {
                                            loggerUi.error(`File was null!`);
                                        }
                                    })
                                    .catch((error) => {
                                        loggerUi.error(`${error}`);
                                    });
                            }}
                        >
                            Process file...
                        </Button>
                    </div>
                </div>
            </Dropzone>
        </div>
    );
}

function onDropHandler(
    files: FileWithPath[],
    setFileData: (fileData: FileData) => void,
    setRegime: (regime: FileRegime) => void,
    navigate: NavigateFunction
) {
    if (files.length === 0) return;

    loggerUi.info(`Dropzone accepted these files: <${files}>.`);
    const file = files[0];
    loggerUi.info(`Only the first file will be handled!`);

    const name = file.name;
    const extension = name.includes(".")
        ? name.substring(name.lastIndexOf(".") + 1).toLowerCase()
        : "";
    const path = (file as any).path ?? "";

    const binaryExtensions = ["cvsx"];
    const toProcessExtensions: string[] = [];
    const isBinary = binaryExtensions.includes(extension);
    const isToProcess = toProcessExtensions.includes(extension);

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

        loggerUi.info(`Converted file data: <${fileData}>.`);
        loggerUi.info(
            `Based on <${
                fileData.extension
            }>, the file data regime was set to <${
                isToProcess ? "toProcess" : "toView"
            }>.`
        );
        setFileData(fileData);
        setRegime(isToProcess ? "toProcess" : "toView");
        navigate("/viewer");
    };

    if (isBinary) {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsText(file);
    }
}

function onRejectHandler(rejections: FileRejection[]) {
    loggerUi.warn(`Dropzone rejected these files: <${rejections}>.`);
}
