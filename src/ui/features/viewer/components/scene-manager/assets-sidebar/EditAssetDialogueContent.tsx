import { useState } from "react";
import { Text } from "@mantine/core";
import { UnstyledTextInput } from "../../../../../components/common/input/UnstyledTextInput";
import { Button } from "../../../../../components/common/button/Button";
import { PathSegmentsBuilder } from "../../../../../components/common/path-segments-builder/PathSegmentsBuilder";
import { compileFinalPath } from "../../../../../components/common/path-segments-builder/utils/compileFinalPath";

export interface EditAssetDialogueReturnType {
    relativePath: string;
}

interface EditAssetDialogueContentProps {
    filename: string;
    pathSegments: string[];
    close: (value?: EditAssetDialogueReturnType) => void;
}

const MAXIMUM_NUMBER_OF_PATH_SEGMENTS = 3; // TODO: define in Settings

export function EditAssetDialogueContent(props: EditAssetDialogueContentProps) {
    // State for up path segments for a relative path of asset.
    const [pathSegments, setPathSegments] = useState<string[]>(
        [...props.pathSegments, "", "", ""].slice(
            0,
            MAXIMUM_NUMBER_OF_PATH_SEGMENTS,
        ),
    );

    // State if path is valid or not.
    const [isPathInvalid, setIsPathInvalid] = useState(true);

    // Render the component.
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1em" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1em" }}>
                <Text size="sm" style={{ minWidth: "9em" }}>
                    Chosen filename:
                </Text>
                <UnstyledTextInput
                    placeholder="N/A"
                    value={props.filename}
                    enabled={false}
                    style={{ flexGrow: 1 }}
                />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1em" }}>
                <Text size="sm" style={{ minWidth: "9em" }}>
                    Relative path:
                </Text>
                <PathSegmentsBuilder
                    count={3}
                    inputPathSegments={pathSegments}
                    onChange={(segments, hasError) => {
                        setPathSegments(segments);
                        setIsPathInvalid(hasError);
                    }}
                />
            </div>

            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "2em",
                }}
            >
                <Button
                    disabled={isPathInvalid}
                    onClick={() =>
                        props.close({
                            relativePath: compileFinalPath(pathSegments),
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
