import { useState } from "react";
import { Checkbox, Collapse, Text } from "@mantine/core";
import { AllFiles } from "../../../../../../types/fileFilters";
import { Button } from "../../../../../components/common/button/Button";
import { UnstyledTextInput } from "../../../../../components/common/input/UnstyledTextInput";
import {
    checkOffersProcessing,
    checkRequiresProcessing,
} from "../../../../../config/assetsDefinitions";
import { pushWarningNotification } from "../../../../../services/NotificationService";
import { PathSegmentsBuilder } from "../../../../../components/common/path-segments-builder/PathSegmentsBuilder";
import { compileFinalPath } from "../../../../../components/common/path-segments-builder/utils/compileFinalPath";
import {
    addExtensionToFilename,
    getFilenameWithoutExtension,
} from "../../../../../utils/fileDataUtils";

export interface AddAssetDialogueReturnType {
    file: FileData;
    relativePath: string;
    processAsset: boolean;
}

interface AddAssetDialogueContentProps {
    close: (value?: AddAssetDialogueReturnType) => void;
}

const MAXIMUM_NUMBER_OF_PATH_SEGMENTS = 3; // TODO: define in Settings

export function AddAssetDialogueContent({
    close,
}: AddAssetDialogueContentProps) {
    // State for the chosen file asset.
    const [file, setFile] = useState<FileData | undefined>(undefined);

    // State for the file name, which can be changed.
    const [fileName, setFilename] = useState<string | undefined>(undefined);

    // State if file name is valid or not.
    const [isFileNameInvalid, setIsFileNameInvalid] = useState(false);

    // State for up path segments for a relative path of asset.
    const [pathSegments, setPathSegments] = useState<string[]>([]);

    // State if path is valid or not.
    const [isPathInvalid, setIsPathInvalid] = useState(true);

    // Boolean flag if the chosen file asset should be processed or not.
    const [processAsset, setProcessAsset] = useState<boolean>(false);

    // Each file asset type defines if it requires or offers processing.
    const requiresProcessing = file
        ? checkRequiresProcessing(file.name)
        : false;
    const offersProcessing = file ? checkOffersProcessing(file.name) : false;
    const showProcessingUi = requiresProcessing || offersProcessing;

    // Render the component.
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1em" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: "0.5em",
                }}
            >
                {/* Choose file asset button. */}
                <Button
                    variant="ghost"
                    onClick={async () => {
                        const result = await window.electron.openFileExplorer(
                            false,
                            [AllFiles],
                        );

                        if (!(result instanceof Error)) {
                            const selectedFile = result[0];
                            setFile(selectedFile);
                            setFilename(
                                getFilenameWithoutExtension(selectedFile.name),
                            );

                            if (checkRequiresProcessing(selectedFile.name)) {
                                setProcessAsset(true);
                            } else {
                                setProcessAsset(false);
                            }
                        } else {
                            pushWarningNotification(
                                `Unable to open file explorer! Details: <${result.message}>.`,
                            );
                        }
                    }}
                    tooltip="Choose file."
                >
                    Choose file...
                </Button>
            </div>

            {/* Chosen file asset label. */}
            <div style={{ display: "flex", alignItems: "center", gap: "1em" }}>
                <Text size="sm" style={{ minWidth: "9em" }}>
                    Chosen filename:
                </Text>
                <UnstyledTextInput
                    placeholder="N/A"
                    value={file?.name || ""}
                    enabled={false}
                    style={{ flexGrow: 1 }}
                />
            </div>

            {/* Change name of the asset. */}
            <div style={{ display: "flex", alignItems: "center", gap: "1em" }}>
                <Text size="sm" style={{ minWidth: "9em" }}>
                    Change name of the asset:
                </Text>
                <UnstyledTextInput
                    placeholder="N/A"
                    value={fileName}
                    enabled={file !== undefined}
                    onValueChange={(value) => {
                        setFilename(value);
                    }}
                    onBlur={(value) => {
                        setFilename(value);
                    }}
                    onErrorChange={(hasError) => {
                        if (hasError) {
                            setIsFileNameInvalid(true);
                        } else {
                            setIsFileNameInvalid(false);
                        }
                    }}
                    style={{ flexGrow: 1 }}
                />
            </div>

            {/* We might show processing checkbox if given asset type allows. */}
            <Collapse expanded={showProcessingUi}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1em",
                    }}
                >
                    <Text size="sm" style={{ minWidth: "9em" }}>
                        Processing:
                    </Text>
                    <Checkbox
                        label={
                            requiresProcessing
                                ? "Must be processed (Required)"
                                : "Will be processed"
                        }
                        size="xs"
                        checked={processAsset}
                        disabled={requiresProcessing}
                        onChange={(e) =>
                            setProcessAsset(e.currentTarget.checked)
                        }
                    />
                    <Text size="xs" c="dimmed">
                        Note that processed files might not share the name you
                        set for asset in this dialogue!
                    </Text>
                </div>
            </Collapse>

            {/* Relative path builder. */}
            <div style={{ display: "flex", alignItems: "center", gap: "1em" }}>
                <Text size="sm" style={{ minWidth: "9em" }}>
                    Relative path:
                </Text>
                <PathSegmentsBuilder
                    count={MAXIMUM_NUMBER_OF_PATH_SEGMENTS}
                    onChange={(segments, hasError) => {
                        setPathSegments(segments);
                        setIsPathInvalid(hasError);
                    }}
                />
            </div>

            {/* Save button. */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "2em",
                }}
            >
                <Button
                    disabled={!file || isPathInvalid || isFileNameInvalid}
                    onClick={() => {
                        const newFile: FileData = {
                            ...file!,
                            name: addExtensionToFilename(
                                fileName!,
                                file!.extension,
                            ),
                        };

                        close({
                            file: newFile,
                            relativePath: compileFinalPath(pathSegments),
                            processAsset,
                        });
                    }}
                    tooltip="Save local asset."
                >
                    Save
                </Button>
            </div>
        </div>
    );
}
