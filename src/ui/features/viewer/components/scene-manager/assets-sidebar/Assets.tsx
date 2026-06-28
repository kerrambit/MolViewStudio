import { useState } from "react";
import { Text, TextInput } from "@mantine/core";
import { IconWorldWww } from "@tabler/icons-react";
import { useManagedAssets } from "../../../../../providers/ManagedAssetsProvider";
import { Button } from "../../../../../components/common/button/Button";
import { DeleteActionIcon } from "../../../../../components/common/actionables/actions-icons/DeleteActionIcon";
import { useDialogue } from "../../../../../providers/DialogueProvider";
import {
    AddAssetDialogueContent,
    type AddAssetDialogueReturnType,
} from "./AddAssetDialogueContent";
import { pushErrorNotification } from "../../../../../services/NotificationService";
import { useWorkspaceManagement } from "../../../../workspace/hooks/useWorkspaceManagement";
import { ActionableList } from "../../../../../components/common/actionables/ActionableList";
import { ActionableListItem } from "../../../../../components/common/actionables/ActionableListItem";
import { LocalAssetsTree } from "./LocalAssetsTree";

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
    } = useManagedAssets();

    // Use workspace management.
    const { processFile } = useWorkspaceManagement();

    // Render the component.
    return (
        <div>
            {/* Local assets part. */}
            <div>
                {/* Header label. */}
                <Text size="xl" mb="sm">
                    Local
                </Text>

                {/* Render all local assets in the form of a tree. */}
                {getAllLocalAssets().length === 0 ? (
                    <Text size="sm" c="dimmed" ta="center">
                        No local assets found...
                    </Text>
                ) : (
                    <LocalAssetsTree />
                )}

                {/* Button to open a dialogue to add new local assets. */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        marginTop: "1em",
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

            {/* Remote assets part. */}
            <div style={{ marginTop: "2em" }}>
                {/* Label. */}
                <Text size="xl" mb="sm">
                    Remote
                </Text>

                {/* Info text if no remote assets are found. */}
                {getAllRemoteAssets().length === 0 ? (
                    <Text size="sm" c="dimmed" ta="center">
                        No remote assets found...
                    </Text>
                ) : (
                    <></>
                )}

                {/* Flat list of remote assets. */}
                <ActionableList>
                    {getAllRemoteAssets().map((asset) => (
                        <ActionableListItem
                            key={asset.asset.id}
                            title={asset.relativePath}
                            titleSize="sm"
                            tooltip={asset.asset.url}
                            leftComponent={
                                <IconWorldWww
                                    size={16}
                                    style={{ opacity: 0.6 }}
                                />
                            }
                            rightComponent={
                                <DeleteActionIcon
                                    onClick={() => removeAsset(asset.asset.url)}
                                    tooltip={
                                        asset.useCount > 0
                                            ? "Cannot delete remote asset, as it is being referenced in view."
                                            : "Delete remote asset."
                                    }
                                    enabled={asset.useCount > 0}
                                />
                            }
                        />
                    ))}
                </ActionableList>

                {/* Input form to add new remote asset. */}
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
                        style={{ flexGrow: 1 }}
                    />
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
