import { Select, TextInput } from "@mantine/core";
import { useState } from "react";
import { getAllExtensions } from "../../../../../config/assetsDefinitions";
import { Button } from "../../../../../components/common/button/Button";
import { getExtensionFromUrl } from "../../../../../utils/fileDataUtils";

export interface AddRemoteAssetDialogueReturnType {
    url: string;
    extension: string;
}

interface AddRemoteAssetDialogueContentProps {
    close: (value?: AddRemoteAssetDialogueReturnType) => void;
}

export function AddRemoteAssetDialogueContent(
    props: AddRemoteAssetDialogueContentProps,
) {
    // Storing current remote url in UI and its extension.
    const [remoteUrl, setRemoteUrl] = useState<string>("");
    const [remoteUrlExtension, setRemoteUrlExtension] = useState<string>("N/A");

    const isUrlValid = (value: string) => {
        let isValid = true;
        try {
            new URL(value);
        } catch (error) {
            isValid = false;
        }
        return isValid;
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                justifyItems: "center",
                justifyContent: "center",
                gap: "1em",
            }}
        >
            <TextInput
                label="Url"
                title="Enter valid URL of the remote asset."
                value={remoteUrl}
                placeholder="https://example.com/file.bcif"
                onChange={(event) => {
                    setRemoteUrl(event.currentTarget.value);
                    setRemoteUrlExtension(
                        getExtensionFromUrl(event.currentTarget.value) || "N/A",
                    );
                }}
                size="sm"
            />

            <Select
                label="Format"
                title="Format of remote asset is automatically derived from URL, or you can select the format youself if needed."
                data={getAllExtensions()}
                value={remoteUrlExtension}
                onChange={(extension) => {
                    if (extension) {
                        setRemoteUrlExtension(extension);
                    }
                }}
                placeholder="N/A"
                size="sm"
                comboboxProps={{ withinPortal: true, zIndex: 9999 }}
            />

            {/* Save button. */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "2em",
                }}
            >
                <Button
                    // TODO: check if it is valid URL
                    disabled={
                        !remoteUrl ||
                        remoteUrl.trim() === "" ||
                        !isUrlValid(remoteUrl) ||
                        !remoteUrlExtension
                    }
                    onClick={() => {
                        props.close({
                            url: remoteUrl,
                            extension: remoteUrlExtension,
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
