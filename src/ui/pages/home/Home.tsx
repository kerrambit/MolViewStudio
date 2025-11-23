import { useNavigate, type NavigateFunction } from "react-router-dom";
import { Dropzone } from "../../components/common/dropzone/Dropzone";
import { Button } from "../../components/common/button/Button";
import type { FileRejection, FileWithPath } from "@mantine/dropzone";
import { useFileData, type FileRegime } from "../../services/FileDataProvider";
import { loggerUi } from "../../utils/loggerUi";
import { useMenu } from "../../services/MenuProvider";
import {
    IconChartBubbleFilled,
    IconFileTime,
    IconFolderOpen,
} from "@tabler/icons-react";
import { useEffect } from "react";

import "./Home.css";
import "@mantine/core/styles.css";
import "@mantine/dropzone/styles.css";

export default function Home() {
    const navigate = useNavigate();
    const { setFileData, setRegime } = useFileData();
    const actions = { setFileData, setRegime, navigate };
    const { addMenuItemIntoSection } = useMenu();

    // TODO: extract it into seperate function
    useEffect(() => {
        addMenuItemIntoSection("file", "general-file", {
            id: "open-file-in-viewer",
            title: "Open file in viewer",
            icon: { icon: IconFolderOpen, position: "left" },
            task: {
                action: () => {
                    loadAndHandleFile({ regime: "toView" }, actions);
                },
                type: "secondary",
            },
        });

        addMenuItemIntoSection("file", "general-file", {
            id: "process-file",
            title: "Process file",
            icon: { icon: IconFolderOpen, position: "left" },
            task: {
                action: () => {
                    loadAndHandleFile({ regime: "toProcess" }, actions);
                },
                type: "secondary",
            },
        });

        // TODO: implement recent files history
        addMenuItemIntoSection("file", "general-file", {
            id: "recent-file",
            title: "Open recent file",
            icon: { icon: IconFileTime, position: "left" },
            task: [
                {
                    id: crypto.randomUUID(),
                    items: [
                        {
                            id: "recent-file-</home/user/data/emd-1832.cvsx>",
                            title: "/home/user/data/emd-1832.cvsx",
                            icon: {
                                icon: IconChartBubbleFilled,
                                position: "left",
                            },
                            task: {
                                action: () => {
                                    console.log("Loading recent file...");
                                },
                                type: "direct",
                            },
                        },
                    ],
                },
            ],
        });
    }, []);

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
                allowedExtensions={["pdb", "mvsx", "mvsj"]}
            >
                {renderDropzoneButtonsArea(actions)}
            </Dropzone>
        </div>
    );
}

// TODO: the part with file extensions must be reimplemented, basically this should be defined in one place (one file), similir thing happens also in electron/main.tsx
function onDropHandler(
    files: File[],
    actions: {
        setFileData: (fileData: FileData) => void;
        setRegime: (regime: FileRegime) => void;
        navigate: NavigateFunction;
    }
) {
    if (files.length === 0) return;

    loggerUi.info(
        `Dropzone accepted these files: ${files.map(
            (file) => `<${file.name}>`
        )}. Only the first file will be handled!`
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
            })}>.`
        );
        loggerUi.info(
            `Based on file extenstions: <${
                fileData.extension
            }>, the file data regime was set to <${
                isToProcess ? "toProcess" : "toView"
            }>.`
        );

        actions.setFileData(fileData);
        actions.setRegime(isToProcess ? "toProcess" : "toView");
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
        `Dropzone rejected these files: <${JSON.stringify(rejections)}>.`
    );
}

function renderDropzoneButtonsArea(actions: {
    setFileData: (fileData: FileData) => void;
    setRegime: (regime: FileRegime) => void;
    navigate: NavigateFunction;
}) {
    return (
        <div className="home__buttonsArea">
            <div style={{ pointerEvents: "auto" }}>
                <Button
                    variant="ghost"
                    onClick={() => {
                        dropzoneButtonHandler(
                            {
                                label: "Open file in viewer...",
                                regime: "toView",
                            },
                            actions
                        );
                    }}
                >
                    Open file in viewer...
                </Button>
            </div>
            <div style={{ pointerEvents: "auto" }}>
                <Button
                    variant="ghost"
                    onClick={() => {
                        dropzoneButtonHandler(
                            {
                                label: "Process file...",
                                regime: "toProcess",
                            },
                            actions
                        );
                    }}
                >
                    Process file...
                </Button>
            </div>
        </div>
    );
}

function dropzoneButtonHandler(
    config: { label: string; regime: FileRegime },
    actions: {
        setFileData: (fileData: FileData) => void;
        setRegime: (regime: FileRegime) => void;
        navigate: NavigateFunction;
    }
) {
    loggerUi.info(config.label);
    loadAndHandleFile({ regime: config.regime }, actions);
}

function loadAndHandleFile(
    config: { regime: FileRegime },
    actions: {
        setFileData: (fileData: FileData) => void;
        setRegime: (regime: FileRegime) => void;
        navigate: NavigateFunction;
    }
) {
    window.electron
        .openFileExplorer()
        .then((fileData) => {
            if (fileData) {
                // TODO: openFileExplorer temporary return FileData[] instead of FileData, this we need to look for the first element here
                loggerUi.info(`File <${fileData[0].path}> was selected.`);
                actions.setFileData(fileData[0]);
                actions.setRegime(config.regime);
                actions.navigate("/viewer");
            } else {
                loggerUi.error(`File was null!`);
            }
        })
        .catch((error) => {
            loggerUi.error(`${error}`);
        });
}
