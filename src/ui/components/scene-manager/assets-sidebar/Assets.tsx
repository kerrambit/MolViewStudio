import { useManagedAssets } from "../../../services/ManagedAssetsProvider";
import { Button } from "../../common/button/Button";
import { Text } from "@mantine/core";
import { useState } from "react";
import { UnstyledTextInput } from "../../common/input/UnstyledTextInput";
import { EditActionIcon } from "../../common/actionable-list-item/actions/EditActionIcon";
import { DeleteActionIcon } from "../../common/actionable-list-item/actions/DeleteActionIcon";
import { ActionableListItem } from "../../common/actionable-list-item/ActionableListItem";
import { useDialogue } from "../../../services/DialogueProvider";
import {
    AddAssetDialogueContent,
    type AddAssetDialogueReturnType,
} from "../../common/dialogue/AddAssetDialogueContent";
import {
    EditAssetDialogueContent,
    type EditAssetDialogueReturnType,
} from "../../common/dialogue/EditAssetDialogueContent";
import { pushWarningNotification } from "../../../services/NotificationService";

export function Assets() {
    const [remoteUrl, setRemoteUrl] = useState<string | undefined>(undefined);

    const { showDialogue } = useDialogue();

    const {
        addLocalAsset,
        addRemoteAsset,
        getAllLocalAssets,
        getAllRemoteAssets,
        removeAsset,
    } = useManagedAssets();

    return (
        <div>
            <div>
                <Text size="xl" mb="sm">
                    Local:
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
                                            pushWarningNotification(
                                                "Editing of relative path is not implemented yet!",
                                            );
                                            // TODO: I am not sure if it is needed to fix also arcp url, I think it is not necesarry?
                                            // but it would be unifed in general
                                            // Now even when I add new local asset the same file, it replaces the old one but I am not sure why and what happens
                                            // with an old arcp address
                                            // now any assets not on ./ wont work anyway as my buildMVS fucntion does not do it anyway

                                            // editRelativePathOfLocalAsset(
                                            //     asset.asset.url,
                                            //     `${result.relativePath}${asset.name}`,
                                            // );
                                        }
                                    }}
                                    tooltip="Edit local asset."
                                ></EditActionIcon>

                                <DeleteActionIcon
                                    onClick={() => {
                                        removeAsset(asset.asset.url);
                                    }}
                                    tooltip="Delete local asset."
                                ></DeleteActionIcon>
                            </div>
                        </ActionableListItem>
                    ))}
                </div>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        marginTop: "2em",
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
                                addLocalAsset(
                                    result.file,
                                    `${result.relativePath}${result.file.name}`,
                                );
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
                    Remote:
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
                                tooltip="Delete remote asset."
                            ></DeleteActionIcon>
                        </ActionableListItem>
                    ))}
                </div>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        marginTop: "2em",
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
