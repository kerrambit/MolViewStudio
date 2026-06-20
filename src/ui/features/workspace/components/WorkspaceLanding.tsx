import type { FileRejection } from "@mantine/dropzone";
import { Dropzone } from "../../../components/common/dropzone/Dropzone.tsx";
import { useWorkspaceManagement } from "../hooks/useWorkspaceManagement.ts";
import { loggerUi } from "../../../services/UiLoggingService.ts";
import { pushWarningNotification } from "../../../services/NotificationService.ts";
import { Button } from "../../../components/common/button/Button.tsx";

export default function WorkspaceLanding() {
    // Hook for loading and handling file.
    const {
        openFileExplorerAndLoadFileInApp,
        loadFileInApp,
        createNewProjectInApp,
    } = useWorkspaceManagement();

    // Render the component.
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: " 100%",
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
) {
    return (
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
                    label="Create new project"
                    tooltip="Creates new blank project."
                    variant="ghost"
                    onClick={() => {
                        loggerUi.info(`Create new project`);
                        createNewProjectInApp();
                    }}
                />
            </div>
            <div style={{ pointerEvents: "auto" }}>
                <Button
                    label="Open file in viewer..."
                    tooltip="Shows file explorer and opens given file in viewer."
                    variant="ghost"
                    onClick={() => {
                        loggerUi.info("Open file in viewer...");
                        openFileExplorerAndLoadFileInApp();
                    }}
                />
            </div>
        </div>
    );
}
