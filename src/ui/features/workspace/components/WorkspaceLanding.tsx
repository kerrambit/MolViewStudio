/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import type { FileRejection } from "@mantine/dropzone";
import { Anchor, Text } from "@mantine/core";
import { Dropzone } from "../../../components/common/dropzone/Dropzone.tsx";
import { useWorkspaceManagement } from "../hooks/useWorkspaceManagement.ts";
import { loggerUi } from "../../../services/UiLoggingService.ts";
import { pushWarningNotification } from "../../../services/NotificationService.ts";
import { Button } from "../../../components/common/button/Button.tsx";
import { useRecentFilesStore } from "../../../stores/recentFilesStore.ts";

export default function WorkspaceLanding() {
    // Hook for loading and handling file.
    const {
        openFileExplorerAndLoadFileInApp,
        loadFileInApp,
        createNewProjectInApp,
    } = useWorkspaceManagement();

    // Use recent files.
    const recentFiles = useRecentFilesStore((set) => set.recentFiles);

    // Use workflow management.
    const { loadRecentFileInApp } = useWorkspaceManagement();

    // Render the component.
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
            }}
        >
            <Dropzone
                onDrop={async (files: File[]) => {
                    await onDropHandler(files, loadFileInApp);
                }}
                onReject={(rejections: FileRejection[]) => {
                    onRejectHandler(rejections);
                }}
                enableMultipleInputFiles={false}
                allowedExtensions={[]} // TODO: disabled all files until https://github.com/kerrambit/MolStarApp/issues/84 is solved
            >
                {renderDropzoneButtonsArea(
                    openFileExplorerAndLoadFileInApp,
                    createNewProjectInApp,
                    recentFiles,
                    loadRecentFileInApp,
                )}
            </Dropzone>
        </div>
    );
}

// TODO: issue https://github.com/kerrambit/MolStarApp/issues/84
async function onDropHandler(
    files: File[],
    loadFileInApp: (fileData: FileData[] | Error) => Promise<void>,
) {
    if (files.length === 0) return;

    loggerUi.info(
        `Dropzone accepted these files: ${files.map(
            (file) => `<${file.name}>`,
        )}. Only the first file will be handled!`,
    );

    // TODO: here is the problem we do not have access to full path of `file`
    const result = await window.electron.getFileData([""]);
    loadFileInApp(result);
}

// TODO: issue https://github.com/kerrambit/MolStarApp/issues/84
function onRejectHandler(rejections: FileRejection[]) {
    loggerUi.warn(
        `Dropzone rejected these files: <${JSON.stringify(rejections)}>.`,
    );
    pushWarningNotification(`File was rejected!`);
}

function renderDropzoneButtonsArea(
    openFileExplorerAndLoadFileInApp: () => Promise<void>,
    createNewProjectInApp: () => void,
    recentFiles: string[],
    loadRecentFileInApp: (path: string) => Promise<void>,
) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "row",
                width: "100%",
                paddingTop: "6em",
            }}
        >
            {/* Left column. */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    justifyContent: "flex-end",
                    paddingRight: "4em",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75em",
                        width: "250px",
                    }}
                >
                    {/* Header. */}
                    <div style={{ width: "100%" }}>
                        <Text size="lg">Start</Text>
                    </div>

                    {/* First button. */}
                    <div style={{ width: "100%", pointerEvents: "auto" }}>
                        <Button
                            label="Create new project"
                            tooltip="Creates new blank project."
                            variant="ghost"
                            onClick={() => {
                                loggerUi.info(
                                    "User's action on home page is: <Create new project>.",
                                );
                                createNewProjectInApp();
                            }}
                        />
                    </div>

                    {/* Second button. */}
                    <div style={{ width: "100%", pointerEvents: "auto" }}>
                        <Button
                            label="Open file in viewer..."
                            tooltip="Shows file explorer and opens given file in viewer."
                            variant="ghost"
                            onClick={() => {
                                loggerUi.info(
                                    "User's action on home page is: <Open file in viewer...>.",
                                );
                                openFileExplorerAndLoadFileInApp();
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Right column. */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    justifyContent: "flex-start",
                    paddingLeft: "4em",
                    minWidth: 0,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: "0.5em",
                        width: "100%",
                        maxWidth: "600px",
                    }}
                >
                    {/* Header. */}
                    <div style={{ width: "100%", marginBottom: "0.5em" }}>
                        <Text size="lg">Recent</Text>
                    </div>

                    {/* Render recent files or label that no recent files were found. */}
                    {recentFiles.length === 0 && (
                        <Text size="md" c="dimmed">
                            No recent files
                        </Text>
                    )}

                    {/* TODO: set the limit in Settings */}
                    {recentFiles.slice(0, 10).map((path, index) => {
                        return (
                            <Anchor
                                title={path}
                                key={index}
                                component="button"
                                truncate="end"
                                size="sm"
                                style={{
                                    display: "block",
                                    textAlign: "left",
                                    width: "100%",
                                }}
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    loggerUi.info(
                                        `Recent file ${path} will be opened`,
                                    );
                                    await loadRecentFileInApp(path);
                                }}
                            >
                                {path}
                            </Anchor>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
