import { useManagedAssets } from "../../../providers/ManagedAssetsProvider";
import { Button } from "../../common/button/Button";
import { Text } from "@mantine/core";
import { useState } from "react";
import { UnstyledTextInput } from "../../common/input/UnstyledTextInput";
import { EditActionIcon } from "../../common/actionables/actions/EditActionIcon";
import { DeleteActionIcon } from "../../common/actionables/actions/DeleteActionIcon";
import { ActionableListItem } from "../../common/actionables/ActionableListItem";
import { useDialogue } from "../../../providers/DialogueProvider";
import {
    AddAssetDialogueContent,
    type AddAssetDialogueReturnType,
} from "./AddAssetDialogueContent";
import {
    EditAssetDialogueContent,
    type EditAssetDialogueReturnType,
} from "./EditAssetDialogueContent";
import { pushErrorNotification } from "../../../services/NotificationService";
import { useFileManagement } from "../../../features/workspace/hooks/useFileManagement";

export function Assets() {
    const [remoteUrl, setRemoteUrl] = useState<string | undefined>(undefined);

    const { showDialogue } = useDialogue();

    const {
        addLocalAsset,
        addRemoteAsset,
        getAllLocalAssets,
        getAllRemoteAssets,
        removeAsset,
        editRelativePathOfLocalAsset,
    } = useManagedAssets();

    const { handleFileAsProcessingOfIndependentAsset } = useFileManagement();

    return (
        <div>
            <div>
                <Text size="xl" mb="sm">
                    Local
                </Text>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: ".25em",
                    }}
                >
                    {getAllLocalAssets().map((asset) => (
                        <ActionableListItem
                            key={asset.asset.id}
                            title={asset.relativePath}
                        >
                            <div>
                                <EditActionIcon
                                    onClick={async () => {
                                        const result =
                                            await showDialogue<EditAssetDialogueReturnType>(
                                                {
                                                    title: "Edit local asset",
                                                    width: "800px",
                                                    showCloseButton: true,
                                                    content: (close) => (
                                                        <EditAssetDialogueContent
                                                            filename={
                                                                asset.name
                                                            }
                                                            pathSegments={asset.relativePath
                                                                .split("/")
                                                                .filter(Boolean)
                                                                .slice(0, -1)}
                                                            close={close}
                                                        />
                                                    ),
                                                },
                                            );

                                        if (result) {
                                            const wasSuccessful =
                                                editRelativePathOfLocalAsset(
                                                    asset.asset.url,
                                                    `${result.relativePath}`,
                                                );
                                            if (!wasSuccessful) {
                                                pushErrorNotification(
                                                    `Asset "${result.relativePath}${asset.name}" already exists!`,
                                                );
                                            }
                                        }
                                    }}
                                    tooltip="Edit local asset."
                                ></EditActionIcon>

                                <DeleteActionIcon
                                    onClick={() => {
                                        removeAsset(asset.asset.url);
                                    }}
                                    tooltip={
                                        asset.useCount > 0
                                            ? "Cannot delete local asset, as it is being referenced in view."
                                            : "Delete local asset."
                                    }
                                    enabled={asset.useCount > 0}
                                ></DeleteActionIcon>
                            </div>
                        </ActionableListItem>
                    ))}
                </div>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        marginTop:
                            getAllLocalAssets().length === 0 ? "0em" : "1em",
                    }}
                >
                    <Button
                        variant="primary"
                        size="medium"
                        onClick={async () => {
                            const result =
                                await showDialogue<AddAssetDialogueReturnType>({
                                    title: "Add local asset",
                                    width: "800px",
                                    showCloseButton: true,
                                    content: (close) => (
                                        <AddAssetDialogueContent
                                            close={close}
                                        />
                                    ),
                                });

                            if (result) {
                                if (!result.processAsset) {
                                    const wasSuccessful = addLocalAsset(
                                        result.file,
                                        result.relativePath,
                                    );
                                    if (!wasSuccessful) {
                                        pushErrorNotification(
                                            `Asset "${result.relativePath}${result.file.name}" already exists!`,
                                        );
                                    }
                                } else {
                                    handleFileAsProcessingOfIndependentAsset(
                                        result.file,
                                        result.relativePath,
                                    );
                                }
                            }
                        }}
                        tooltip="Open dialogue to add new local asset."
                    >
                        Add...
                    </Button>
                </div>
            </div>

            <div>
                <Text size="xl" mb="sm">
                    Remote
                </Text>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: ".25em",
                    }}
                >
                    {getAllRemoteAssets().map((asset) => (
                        <ActionableListItem
                            key={asset.asset.id}
                            title={asset.relativePath}
                        >
                            <DeleteActionIcon
                                onClick={() => {
                                    removeAsset(asset.asset.url);
                                }}
                                tooltip={
                                    asset.useCount > 0
                                        ? "Cannot delete remote asset, as it is being referenced in view."
                                        : "Delete remote asset."
                                }
                                enabled={asset.useCount > 0}
                            ></DeleteActionIcon>
                        </ActionableListItem>
                    ))}
                </div>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        marginTop:
                            getAllRemoteAssets().length === 0 ? "0em" : "1em",
                        gap: "0.5em",
                    }}
                >
                    <UnstyledTextInput
                        value={remoteUrl}
                        placeholder="https://example.com/file.bcif"
                        onBlur={setRemoteUrl}
                        onValueChange={setRemoteUrl}
                        canBeEmpty={true}
                        style={{
                            flexGrow: 1,
                        }}
                    ></UnstyledTextInput>
                    <Button
                        variant="primary"
                        size="small"
                        onClick={() => {
                            if (remoteUrl && remoteUrl.trim() !== "") {
                                // TODO: check if it is valid URL
                                addRemoteAsset(remoteUrl.trim());
                                setRemoteUrl("");
                            }
                        }}
                        tooltip="Add new remote accet."
                    >
                        Add
                    </Button>
                </div>
            </div>
        </div>
    );
}
