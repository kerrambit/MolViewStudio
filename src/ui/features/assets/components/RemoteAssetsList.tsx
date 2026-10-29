/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { Button, Text } from "@mantine/core";
import { IconAlertHexagon, IconWorldWww } from "@tabler/icons-react";
import { useCallback, useMemo } from "react";
import { ActionableList } from "../../../components/common/actionables/ActionableList";
import { ActionableListItem } from "../../../components/common/actionables/ActionableListItem";
import { DeleteActionIcon } from "../../../components/common/actionables/actions-icons/DeleteActionIcon";
import { EditActionIcon } from "../../../components/common/actionables/actions-icons/EditActionIcon";
import { useDialogueStore } from "../../dialogue/stores/dialogueStore";
import {
    useManagedAssetsStore,
    isManagedAssetRemote,
} from "../../managed-assets/stores/managedAssetsStore";
import {
    AddRemoteAssetDialogueContent,
    type AddRemoteAssetDialogueReturnType,
} from "./AddRemoteAssetDialogueContent";
import { DeleteAssetDialogueContent } from "./DeleteAssetDialogueContent";
import { useAppearance } from "../../apperance/hooks/useAppearance";

/**
 * Returns the warning text for a remote asset with unknown extension and/or type.
 * Empty string means there is nothing to warn about.
 */
function getWarningText(hasUnknownExtension: boolean, hasUnknownType: boolean): string {
    if (hasUnknownExtension && hasUnknownType) {
        return "Could not detect file extension and asset type! Please set them manually.";
    }
    if (hasUnknownExtension) {
        return "Could not detect file extension! Please set it manually.";
    }
    if (hasUnknownType) {
        return "Could not detect asset type! Please set it manually.";
    }
    return "";
}

/**
 * Self-contained list of remote assets, including the info text for the empty state
 * and the button to add a new remote asset.
 */
export function RemoteAssetsList() {
    // Use appearance.
    const { colorScheme } = useAppearance();

    // Use managed assets.
    const assets = useManagedAssetsStore((state) => state.assets);
    const addRemoteAsset = useManagedAssetsStore((state) => state.addRemoteAsset);
    const editRemoteAsset = useManagedAssetsStore((state) => state.editRemoteAsset);
    const removeAsset = useManagedAssetsStore((state) => state.removeAsset);

    const remoteAssets = useMemo(
        () => Array.from(assets.values()).filter(isManagedAssetRemote),
        [assets],
    );

    const handleAddRemoteAsset = useCallback(async () => {
        const result = await useDialogueStore
            .getState()
            .showDialogue<AddRemoteAssetDialogueReturnType>({
                title: "Add remote asset",
                width: "800px",
                showCloseButton: true,
                content: (close) => (
                    <AddRemoteAssetDialogueContent
                        url={undefined}
                        extension={undefined}
                        type={undefined}
                        close={close}
                    />
                ),
            });

        if (result?.url && result.url.trim() !== "") {
            addRemoteAsset(result.url.trim(), result.extension, result.type);
        }
    }, [addRemoteAsset]);

    const handleEditRemoteAsset = useCallback(
        async (asset: (typeof remoteAssets)[number]) => {
            const originalUrl = asset.asset.url;
            const result = await useDialogueStore
                .getState()
                .showDialogue<AddRemoteAssetDialogueReturnType>({
                    title: "Edit remote asset",
                    width: "800px",
                    showCloseButton: true,
                    content: (close) => (
                        <AddRemoteAssetDialogueContent
                            url={asset.asset.url}
                            extension={
                                asset.extension === "unknown"
                                    ? undefined
                                    : asset.extension
                            }
                            type={asset.type}
                            close={close}
                        />
                    ),
                });

            if (result?.url && result.url.trim() !== "") {
                editRemoteAsset(
                    originalUrl,
                    result.url.trim(),
                    result.extension,
                    result.type,
                );
            }
        },
        [editRemoteAsset],
    );

    const handleDeleteRemoteAsset = useCallback(
        async (asset: (typeof remoteAssets)[number]) => {
            const result = await useDialogueStore.getState().showDialogue<boolean>({
                title: "Delete Confirmation",
                width: "550px",
                showCloseButton: true,
                content: (close) => (
                    <DeleteAssetDialogueContent assetName={asset.name} close={close} />
                ),
            });

            if (result) {
                removeAsset(asset.asset.url);
            }
        },
        [removeAsset],
    );

    // Render the component.
    return (
        <div>
            {/* Info text if no remote assets are found. */}
            {remoteAssets.length === 0 && (
                <Text size="sm" c="dimmed" ta="center">
                    No remote assets found...
                </Text>
            )}

            {/* Flat list of remote assets. */}
            <ActionableList>
                {remoteAssets.map((asset) => {
                    // Asset might have `unknown` extension and we must force user to fix the extension in the dialogue window.
                    const hasUnknownExtension = asset.extension === "unknown";

                    // The same for asset type.
                    const hasUnknownType = asset.type === "Unknown";

                    const hasWarning = hasUnknownExtension || hasUnknownType;
                    const warningText = getWarningText(
                        hasUnknownExtension,
                        hasUnknownType,
                    );

                    return (
                        <ActionableListItem
                            key={asset.asset.id}
                            style={
                                hasWarning
                                    ? {
                                          backgroundColor:
                                              colorScheme === "light"
                                                  ? "rgba(251, 191, 36, 0.8)"
                                                  : "rgba(162, 123, 27, 0.8)",
                                      }
                                    : {}
                            }
                            titleSize="sm"
                            title={asset.asset.url}
                            tooltip={asset.asset.url}
                            leftComponent={
                                hasWarning ? (
                                    <div
                                        title={warningText}
                                        style={{
                                            display: "flex",
                                            flexDirection: "row",
                                            gap: "0.35em",
                                        }}
                                    >
                                        <IconWorldWww
                                            size={16}
                                            style={{ opacity: 0.6 }}
                                        />
                                        <IconAlertHexagon
                                            size={16}
                                            style={{ opacity: 0.75 }}
                                        />
                                    </div>
                                ) : (
                                    <IconWorldWww size={16} style={{ opacity: 0.6 }} />
                                )
                            }
                            rightComponent={
                                <>
                                    <EditActionIcon
                                        onClick={() => handleEditRemoteAsset(asset)}
                                        tooltip="Edit remote asset."
                                    />
                                    <DeleteActionIcon
                                        onClick={() => handleDeleteRemoteAsset(asset)}
                                        tooltip={
                                            asset.useCount > 0
                                                ? "Cannot delete remote asset, as it is being referenced in view."
                                                : "Delete remote asset."
                                        }
                                        enabled={!(asset.useCount > 0)}
                                    />
                                </>
                            }
                        />
                    );
                })}
            </ActionableList>

            {/* Button to open a dialogue to add new remote asset. */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: remoteAssets.length === 0 ? "0.5em" : "1em",
                    gap: "0.5em",
                }}
            >
                <Button
                    variant="filled"
                    size="sm"
                    onClick={handleAddRemoteAsset}
                    title="Add new remote asset."
                    leftSection={<IconWorldWww size={16} />}
                >
                    Add...
                </Button>
            </div>
        </div>
    );
}
