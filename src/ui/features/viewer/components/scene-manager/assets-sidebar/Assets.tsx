import { useManagedAssets } from "../../../../../providers/ManagedAssetsProvider";
import { Button } from "../../../../../components/common/button/Button";
import { Text, TextInput } from "@mantine/core";
import { useState } from "react";
import { EditActionIcon } from "../../../../../components/common/actionables/actions-icons/EditActionIcon";
import { DeleteActionIcon } from "../../../../../components/common/actionables/actions-icons/DeleteActionIcon";
import { ActionableListItem } from "../../../../../components/common/actionables/ActionableListItem";
import { useDialogue } from "../../../../../providers/DialogueProvider";
import {
    AddAssetDialogueContent,
    type AddAssetDialogueReturnType,
} from "./AddAssetDialogueContent";
import {
    EditAssetDialogueContent,
    type EditAssetDialogueReturnType,
} from "./EditAssetDialogueContent";
import { pushErrorNotification } from "../../../../../services/NotificationService";
import { useWorkspaceManagement } from "../../../../workspace/hooks/useWorkspaceManagement";
import { ActionableList } from "../../../../../components/common/actionables/ActionableList";

export function Assets() {
    // Storing current remote url in UI,
    const [remoteUrl, setRemoteUrl] = useState<string | undefined>(undefined);

    // Use dialogue.
    const { showDialogue } = useDialogue();

    // Use managed assets.
    const {
        addLocalAsset,
        addRemoteAsset,
        getAllLocalAssets,
        getAllRemoteAssets,
        removeAsset,
        editRelativePathAndFilenameOfLocalAsset,
    } = useManagedAssets();

    // Use workspace management.
    const { processFile } = useWorkspaceManagement();

    // Render the component.
    return (
        <div>
            <div>
                <Text size="xl" mb="sm">
                    Local
                </Text>

                <ActionableList>
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
                                                editRelativePathAndFilenameOfLocalAsset(
                                                    asset.asset.url,
                                                    `${result.newFileName}`,
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
                </ActionableList>

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
                                    processFile(
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
                <ActionableList>
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
                </ActionableList>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        marginTop:
                            getAllRemoteAssets().length === 0 ? "0em" : "1em",
                        gap: "0.5em",
                    }}
                >
                    <TextInput
                        value={remoteUrl}
                        title="Add new remote asset."
                        aria-label="Add new remote asset."
                        placeholder="https://example.com/file.bcif"
                        onChange={(event) =>
                            setRemoteUrl(event.currentTarget.value)
                        }
                        style={{
                            flexGrow: 1,
                        }}
                    ></TextInput>
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
                        tooltip="Add new remote asset."
                    >
                        Add
                    </Button>
                </div>
            </div>
        </div>
    );
}
