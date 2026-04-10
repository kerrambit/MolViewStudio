import { useState } from "react";
import { Text } from "@mantine/core";
import { AllFiles } from "../../../../types/fileFilters";
import { Button } from "../button/Button";
import { UnstyledTextInput } from "../input/UnstyledTextInput";

export interface AddAssetDialogueReturnType {
    file: FileData;
    relativePath: string;
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
                            setFile(result[0]);
                        } else {
                            // TODO: show error dialogue
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
                        close({ file: file!, relativePath: compileFinalPath() })
                    }
                    tooltip="Save local asset."
                >
                    Save
                </Button>
            </div>
        </div>
    );
}
