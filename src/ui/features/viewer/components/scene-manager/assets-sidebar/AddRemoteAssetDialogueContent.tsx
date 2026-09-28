/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { Text, Select } from "@mantine/core";
import { useState } from "react";
import {
    getAllExtensions,
    isExtensionSupported,
    type ExtensionType,
} from "../../../../../config/assetsDefinitions";
import { Button } from "../../../../../components/common/button/Button";
import { getExtensionFromUrl } from "../../../../../utils/fileDataUtils";
import { UnstyledTextInput } from "../../../../../components/common/input/UnstyledTextInput";

export interface AddRemoteAssetDialogueReturnType {
    url: string;
    type: ManagedAssetType;
    extension: string;
}

interface AddRemoteAssetDialogueContentProps {
    close: (value?: AddRemoteAssetDialogueReturnType) => void;
    url: string | undefined;
    extension: string | undefined;
    type: ManagedAssetType | undefined;
}

export function AddRemoteAssetDialogueContent(
    props: AddRemoteAssetDialogueContentProps,
) {
    // Storing current remote url in UI and its extension.
    const [remoteUrl, setRemoteUrl] = useState<string | undefined>(props.url);
    const [remoteUrlExtension, setRemoteUrlExtension] = useState<
        ExtensionType | undefined
    >(props.extension as ExtensionType | undefined);

    // State for the type of asset.
    const [assetType, setAssetType] = useState<ManagedAssetType | undefined>(
        props.type,
    );

    // Fucntions which checks if the value is valid Url.
    const isUrlValid = (value: string) => {
        let isValid = true;
        try {
            new URL(value);
        } catch {
            isValid = false;
        }
        return isValid;
    };

    // Render the component.
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "1em",
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "start",
                    alignItems: "center",
                }}
            >
                <Text size="sm" style={{ minWidth: "5em" }}>
                    Url:
                </Text>
                <UnstyledTextInput
                    tooltip="Enter valid Url of remote asset."
                    placeholder="https://example.com/file.bcif"
                    maxLength={520}
                    value={remoteUrl}
                    onValueChange={(value) => {
                        setRemoteUrl(value);
                        if (value) {
                            const extension = getExtensionFromUrl(value);
                            if (!extension) {
                                setRemoteUrlExtension(undefined);
                                return;
                            }

                            if (isExtensionSupported(extension)) {
                                setRemoteUrlExtension(
                                    extension as ExtensionType,
                                );
                            } else {
                                setRemoteUrlExtension(undefined);
                            }
                        } else setRemoteUrlExtension(undefined);
                    }}
                    onBlur={(value) => {
                        setRemoteUrl(value);
                        if (value) {
                            const extension = getExtensionFromUrl(value);
                            if (!extension) {
                                setRemoteUrlExtension(undefined);
                                return;
                            }

                            if (isExtensionSupported(extension)) {
                                setRemoteUrlExtension(
                                    extension as ExtensionType,
                                );
                            } else {
                                setRemoteUrlExtension(undefined);
                            }
                        } else setRemoteUrlExtension(undefined);
                    }}
                    canBeEmpty={false}
                    validator={(value) => {
                        // Empty value is handled automatically by `canBeEmpty`.
                        if (value) {
                            if (!isUrlValid(value)) {
                                return "Not valid Url!";
                            }
                        }
                        return null;
                    }}
                    style={{ flexGrow: 1 }}
                />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1em" }}>
                <Text size="sm" style={{ minWidth: "3em" }}>
                    Format:
                </Text>
                <Select
                    title="Format of remote asset is automatically derived from URL, or you can select the format youself if needed."
                    data={getAllExtensions()}
                    value={remoteUrlExtension}
                    onChange={(extension) => {
                        if (extension) {
                            setRemoteUrlExtension(extension as ExtensionType);
                        }
                    }}
                    placeholder="N/A"
                    size="sm"
                    error={
                        remoteUrlExtension === undefined
                            ? "Must be valid format!"
                            : undefined
                    }
                    comboboxProps={{ withinPortal: true, zIndex: 9999 }}
                />
            </div>

            {/* Asset type. */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1em",
                }}
            >
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
                    placeholder="N/A"
                    onChange={(type) => {
                        if (type) {
                            setAssetType(type as ManagedAssetType);
                        }
                    }}
                    error={
                        assetType === undefined || assetType === "Unknown"
                            ? "Must be valid asset type!"
                            : undefined
                    }
                    size="sm"
                    comboboxProps={{ withinPortal: true, zIndex: 9999 }}
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
                    disabled={
                        !remoteUrl ||
                        remoteUrl.trim() === "" ||
                        !isUrlValid(remoteUrl) ||
                        !remoteUrlExtension ||
                        !assetType
                    }
                    onClick={() => {
                        props.close({
                            url: remoteUrl!,
                            type: assetType!,
                            extension: remoteUrlExtension!,
                        });
                    }}
                    tooltip="Save remote asset."
                >
                    Save
                </Button>
            </div>
        </div>
    );
}
