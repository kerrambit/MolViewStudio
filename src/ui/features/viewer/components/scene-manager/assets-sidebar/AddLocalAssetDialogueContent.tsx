/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useState } from "react";
import { Loader, Select, Text } from "@mantine/core";
import { AllFiles } from "../../../../../../types/fileFilters";
import { Button } from "../../../../../components/common/button/Button";
import { UnstyledTextInput } from "../../../../../components/common/input/UnstyledTextInput";
import { pushWarningNotification } from "../../../../../services/NotificationService";
import {
    checkOffersProcessing,
    checkRequiresProcessing,
} from "../../../../../config/assetsDefinitions";
import { PathSegmentsBuilder } from "../../../../../components/common/path-segments-builder/PathSegmentsBuilder";
import { compileFinalPath } from "../../../../../components/common/path-segments-builder/utils/compileFinalPath";
import {
    addExtensionToFilename,
    getFilenameWithoutExtension,
} from "../../../../../utils/fileDataUtils";
import { IconAlertTriangle } from "@tabler/icons-react";

export interface AddLocalAssetDialogueFileReturnType {
    file: FileData;
    offersProcessing: boolean;
    requiresProcessing: boolean;
}

export interface AddLocalAssetDialogueReturnType {
    files: AddLocalAssetDialogueFileReturnType[];
    type: ManagedAssetType;
    relativePath: string;
}

interface AddLocalAssetDialogueContentProps {
    close: (value?: AddLocalAssetDialogueReturnType) => void;
}

const MAXIMUM_NUMBER_OF_PATH_SEGMENTS = 3; // TODO: define in Settings
const ALLOW_FILES_MULTISELECTION = true;

export function AddLocalAssetDialogueContent({
    close,
}: AddLocalAssetDialogueContentProps) {
    // State if any file is loading at the moment.
    const [fileLoading, setFileLoading] = useState(false);

    // State for the chosen files assets.
    const [files, setFiles] = useState<FileData[]>([]);

    // State for the file name, which can be changed. Only used when a single file is chosen.
    const [fileName, setFilename] = useState<string | undefined>(undefined);

    // State if file name is valid or not.
    const [isFileNameInvalid, setIsFileNameInvalid] = useState(false);

    // State for the type of asset.
    const [assetType, setAssetType] = useState<ManagedAssetType>("Volume");

    // State for up path segments for a relative path of asset. Default type is "Volume", hence the default folder.
    const [pathSegments, setPathSegments] = useState<string[]>(["volumes"]);

    // State if path is valid or not.
    const [isPathInvalid, setIsPathInvalid] = useState(false);

    // Name can be changed only if exactly one file is chosen.
    const isSingleFile = files.length === 1;

    // Check if any of the selected files require processing
    const anyFileRequiresProcessing = files.some((file) =>
        checkRequiresProcessing(file.extension),
    );

    // Render the component.
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1em" }}>
            {/* The div for Choose file assets button. */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: "0.5em",
                }}
            >
                {/* Choose file assets button. */}
                <Button
                    variant="ghost"
                    tooltip="Choose file(s)."
                    onClick={async () => {
                        setFileLoading(true);
                        const result = await window.electron.openFileExplorer(
                            ALLOW_FILES_MULTISELECTION,
                            [AllFiles],
                        );

                        if (!(result instanceof Error)) {
                            if (result.length > 0) {
                                setFiles(result);

                                if (result.length === 1) {
                                    setFilename(
                                        getFilenameWithoutExtension(
                                            result[0].name,
                                        ),
                                    );
                                }
                            }
                        } else {
                            pushWarningNotification(
                                `Unable to open file explorer! Details: <${result.message}>.`,
                            );
                        }

                        setFileLoading(false);
                    }}
                >
                    Choose file(s)...
                </Button>
            </div>
            {/* Loader. */}
            {fileLoading && (
                <div
                    title="Loading the file(s)..."
                    style={{ display: "flex", justifyContent: "center" }}
                >
                    <Loader />
                </div>
            )}
            {/* Chosen file assets label. */}
            <div style={{ display: "flex", alignItems: "center", gap: "1em" }}>
                <Text size="sm" style={{ minWidth: "9em" }}>
                    Chosen filename{files.length > 1 ? "s" : ""}:
                </Text>
                <UnstyledTextInput
                    placeholder="N/A"
                    value={files.map((file) => file.name).join(", ")}
                    enabled={false}
                    style={{ flexGrow: 1 }}
                />
            </div>
            {/* Change name of the asset, only when a single file is chosen. */}
            {isSingleFile && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1em",
                    }}
                >
                    <Text size="sm" style={{ minWidth: "9em" }}>
                        Change name of the asset:
                    </Text>
                    <UnstyledTextInput
                        placeholder="N/A"
                        value={fileName}
                        enabled={isSingleFile}
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
            )}

            {/* Asset type. */}
            <div style={{ display: "flex", alignItems: "center", gap: "1em" }}>
                <Text size="sm">Type of asset:</Text>
                <Select
                    title=""
                    data={[
                        "Volume",
                        "Segmentation",
                        "Structure",
                        "Annotation",
                        "Other",
                    ]}
                    value={assetType}
                    onChange={(type) => {
                        if (type) {
                            setAssetType(type as ManagedAssetType);
                            switch (type) {
                                case "Volume":
                                    setPathSegments(["volumes"]);
                                    break;
                                case "Segmentation":
                                    setPathSegments(["segmentations"]);
                                    break;
                                case "Structure":
                                    setPathSegments(["structures"]);
                                    break;
                                case "Annotation":
                                    setPathSegments(["annotations"]);
                                    break;
                                default:
                                    break;
                            }
                            setIsPathInvalid(false);
                        }
                    }}
                    size="sm"
                    comboboxProps={{ withinPortal: true, zIndex: 9999 }}
                />
            </div>

            {/* Relative path builder. */}
            {assetType === "Other" && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1em",
                    }}
                >
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
            )}

            {/* Warnings and Save button wrapper */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "2em",
                    marginTop: "1em",
                }}
            >
                {anyFileRequiresProcessing && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5em",
                        }}
                    >
                        <IconAlertTriangle size={16} />
                        <Text size="xs">
                            Warning: processing is required for one or more
                            selected files!
                        </Text>
                    </div>
                )}

                <Button
                    disabled={
                        files.length === 0 ||
                        isPathInvalid ||
                        (isSingleFile && isFileNameInvalid)
                    }
                    onClick={() => {
                        const finalFiles: AddLocalAssetDialogueFileReturnType[] =
                            files.map((file) => {
                                const finalFile = isSingleFile
                                    ? {
                                          ...file,
                                          name: addExtensionToFilename(
                                              fileName!,
                                              file.extension,
                                          ),
                                      }
                                    : file;

                                return {
                                    file: finalFile,
                                    offersProcessing: checkOffersProcessing(
                                        file.extension,
                                    ),
                                    requiresProcessing: checkRequiresProcessing(
                                        file.extension,
                                    ),
                                };
                            });

                        close({
                            files: finalFiles,
                            type: assetType,
                            relativePath: compileFinalPath(pathSegments),
                        });
                    }}
                    tooltip="Save local asset(s)."
                >
                    Save
                </Button>
            </div>
        </div>
    );
}
