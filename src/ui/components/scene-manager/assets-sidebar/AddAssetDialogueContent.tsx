import { useState } from "react";
import { Checkbox, Collapse, Text } from "@mantine/core";
import { AllFiles } from "../../../../types/fileFilters";
import { Button } from "../../common/button/Button";
import { UnstyledTextInput } from "../../common/input/UnstyledTextInput";
import {
    checkOffersProcessing,
    checkRequiresProcessing,
} from "../../../domain/assetsConfig";
import { pushWarningNotification } from "../../../services/NotificationService";

export interface AddAssetDialogueReturnType {
    file: FileData;
    relativePath: string;
    processAsset: boolean;
}

interface AddAssetDialogueContentProps {
    close: (value?: AddAssetDialogueReturnType) => void;
}

export function AddAssetDialogueContent({
    close,
}: AddAssetDialogueContentProps) {
    const [file, setFile] = useState<FileData | undefined>(undefined);
    const [pathSegments, setPathSegments] = useState<string[]>(["", "", ""]);
    const [segmentErrors, setSegmentErrors] = useState<boolean[]>([
        false,
        false,
        false,
    ]);

    const [processAsset, setProcessAsset] = useState<boolean>(false);

    const handleSegmentChange = (
        index: number,
        newValue: string | undefined,
    ) => {
        const updatedSegments = [...pathSegments];
        updatedSegments[index] = newValue || "";
        setPathSegments(updatedSegments);
    };

    const compileFinalPath = () => {
        const validFolders = pathSegments.filter((seg) => seg.trim() !== "");
        const folderPath = validFolders.join("/");
        return folderPath ? `${folderPath}/` : "";
    };

    const requiresProcessing = file
        ? checkRequiresProcessing(file.name)
        : false;
    const offersProcessing = file ? checkOffersProcessing(file.name) : false;
    const showProcessingUi = requiresProcessing || offersProcessing;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1em" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: "0.5em",
                }}
            >
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
                </div>
            </Collapse>

            <div style={{ display: "flex", alignItems: "center", gap: "1em" }}>
                <Text size="sm" style={{ minWidth: "9em" }}>
                    Relative path:
                </Text>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1em",
                        flexGrow: 1,
                    }}
                >
                    {/* TODO: this deserves to be extracted as its own component */}
                    {pathSegments.map((segment, index) => (
                        <div
                            key={index}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "1em",
                            }}
                        >
                            <UnstyledTextInput
                                value={segment}
                                enabled={
                                    index === 0 ||
                                    pathSegments[index - 1].trim() !== ""
                                }
                                canBeEmpty={pathSegments
                                    .slice(index + 1)
                                    .every((seg) => seg.trim() === "")}
                                onValueChange={(val) =>
                                    handleSegmentChange(index, val)
                                }
                                onBlur={(val) =>
                                    handleSegmentChange(index, val)
                                }
                                onErrorChange={(hasError) => {
                                    setSegmentErrors((prev) => {
                                        const newErrors = [...prev];
                                        newErrors[index] = hasError;
                                        return newErrors;
                                    });
                                }}
                                style={{ width: "11em" }}
                            />
                            {index < pathSegments.length - 1 && <Text>/</Text>}
                        </div>
                    ))}
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "2em",
                }}
            >
                <Button
                    disabled={!file || segmentErrors.some((hasErr) => hasErr)}
                    onClick={() =>
                        close({
                            file: file!,
                            relativePath: compileFinalPath(),
                            processAsset,
                        })
                    }
                    tooltip="Save local asset."
                >
                    Save
                </Button>
            </div>
        </div>
    );
}
