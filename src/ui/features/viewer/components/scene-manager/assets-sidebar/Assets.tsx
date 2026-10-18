/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { Text } from "@mantine/core";
import { IconAlertOctagonFilled, IconWorldWww } from "@tabler/icons-react";
import { Button } from "../../../../../components/common/button/Button";
import { DeleteActionIcon } from "../../../../../components/common/actionables/actions-icons/DeleteActionIcon";
import {
    AddLocalAssetDialogueContent,
    type AddLocalAssetDialogueReturnType,
} from "./AddLocalAssetDialogueContent";
import {
    pushErrorNotification,
    pushInfoNotification,
} from "../../../../../services/NotificationService";
import { checkRequiresProcessing } from "../../../../../config/assetsDefinitions";
import { ActionableList } from "../../../../../components/common/actionables/ActionableList";
import { ActionableListItem } from "../../../../../components/common/actionables/ActionableListItem";
import { LocalAssetsTree } from "./LocalAssetsTree";
import { DeleteAssetDialogueContent } from "./DeleteAssetDialogueContent";
import {
    AddRemoteAssetDialogueContent,
    type AddRemoteAssetDialogueReturnType,
} from "./AddRemoteAssetDialogueContent";
import { EditActionIcon } from "../../../../../components/common/actionables/actions-icons/EditActionIcon";
import {
    isManagedAssetLocal,
    isManagedAssetRemote,
    useManagedAssetsStore,
} from "../../../../../stores/managedAssetsStore";
import { useFileMappingsStore } from "../../../../../stores/fileMappingsStore";
import { useDialogueStore } from "../../../../../stores/dialogueStore";
import { getFileSizeInBytes } from "../../../../../utils/fileDataUtils";
import { useCallback } from "react";
import { loggerUi } from "../../../../../services/UiLoggingService";
import { PREVIEW_DOWNSAMPLING_SIZE_THRESHOLD } from "../../../../processing/preview/domain/constants";
import { useStartPreviewFileProcessing } from "../../../../processing/preview/hooks/useStartPreviewFileProcessing";
import { useStartFileProcessing } from "../../../../processing/preview/hooks/useStartFileProcessing";
import { useStartFileRequiredProcessing } from "../../../../processing/preview/hooks/useStartFileRequiredProcessing";
import {
    MINIMAL_FILE_SIZE_TO_PROCESS_IN_BYTES,
    MINIMAL_FILE_SIZE_TO_PROCESS_IN_BYTES_AS_STRING,
} from "../../../../processing/domain/constants";

export function Assets() {
    // Use managed assets.
    const assets = useManagedAssetsStore((state) => state.assets);
    const addLocalAsset = useManagedAssetsStore((state) => state.addLocalAsset);
    const addRemoteAsset = useManagedAssetsStore((state) => state.addRemoteAsset);
    const editRemoteAsset = useManagedAssetsStore((state) => state.editRemoteAsset);
    const removeAsset = useManagedAssetsStore((state) => state.removeAsset);

    // Use file mappings.
    const resolveAndStoreMapping = useFileMappingsStore(
        (state) => state.resolveAndStoreMapping,
    );

    // Use processing.
    const { startFileProcessing } = useStartFileProcessing();
    const { startFileRequiredProcessing } = useStartFileRequiredProcessing();

    // Use preview.
    const { startPreviewFileProcessing } = useStartPreviewFileProcessing();

    // Opens a dialogue to add local assets and processes the chosen files.
    const handleAddLocalAsset = useCallback(async () => {
        const result = await useDialogueStore
            .getState()
            .showDialogue<AddLocalAssetDialogueReturnType>({
                title: "Add local asset",
                width: "800px",
                showCloseButton: true,
                content: (close) => <AddLocalAssetDialogueContent close={close} />,
            });

        if (!result) {
            return;
        }

        for (const { file, offersProcessing } of result.files) {
            const requiresProcessing = checkRequiresProcessing(file.extension);

            // Add new managed asset.
            const newAsset = addLocalAsset(
                file,
                result.relativePath,
                result.type,
                requiresProcessing,
            );

            if (!newAsset) {
                pushErrorNotification(
                    `Asset "${result.relativePath}${file.name}" already exists!`,
                );
                continue;
            }

            // Resolve and store the file mapping for the newly created asset.
            const resolvedPath = await resolveAndStoreMapping(newAsset.id, file.path);
            if (!resolvedPath) {
                pushErrorNotification(
                    `Failed to store file mapping for asset "${result.relativePath}${file.name}"! Export and further processing of this asset may not work.`,
                );
                loggerUi.error(
                    `Failed to store file mapping for asset "${result.relativePath}${file.name}"!`,
                );
            }

            // Large volume assets which offer processing are automatically downsampled into a preview using the nearest algorithm.
            const contentSizeInBytes = getFileSizeInBytes(file);

            if (
                contentSizeInBytes < MINIMAL_FILE_SIZE_TO_PROCESS_IN_BYTES &&
                requiresProcessing
            ) {
                pushInfoNotification(
                    `File "${file.name}" requires processing, but its size is too small (< ${MINIMAL_FILE_SIZE_TO_PROCESS_IN_BYTES_AS_STRING}) to use standart processing. Therefore, the file will be skipped.`,
                );
                continue;
            }

            const isProcessableType =
                result.type === "Volume" || result.type === "Segmentation";

            const shouldProcess =
                isProcessableType &&
                ((offersProcessing &&
                    contentSizeInBytes > PREVIEW_DOWNSAMPLING_SIZE_THRESHOLD) ||
                    requiresProcessing);

            if (!shouldProcess) {
                continue;
            }

            if (requiresProcessing) {
                await startFileRequiredProcessing(
                    file,
                    result.type === "Segmentation" ? "Segmentation" : "Volume",
                    newAsset,
                    result.relativePath,
                );
            } else {
                await startPreviewFileProcessing(
                    file,
                    result.type === "Segmentation" ? "Segmentation" : "Volume",
                    newAsset,
                    result.relativePath,
                );
            }
        }
    }, [addLocalAsset, resolveAndStoreMapping, startFileProcessing]);

    // Render the component.
    return (
        <div>
            {/* Local assets part. */}
            <div>
                {/* Header label. */}
                <Text
                    size="xl"
                    mb="sm"
                    title="Navigate with <Up>/<Down>, Expand with <Space>."
                >
                    Local
                </Text>

                {/* Render all local assets in the form of a tree. Hidden assets (e.g. previews) are not shown. */}
                {Array.from(assets.values())
                    .filter(isManagedAssetLocal)
                    .filter((asset) => !asset.hidden).length === 0 ? (
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
                        onClick={handleAddLocalAsset}
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
                {Array.from(assets.values()).filter(isManagedAssetRemote).length === 0 ? (
                    <Text size="sm" c="dimmed" ta="center">
                        No remote assets found...
                    </Text>
                ) : (
                    <></>
                )}

                {/* Flat list of remote assets. */}
                <ActionableList>
                    {Array.from(assets.values())
                        .filter(isManagedAssetRemote)
                        .map((asset) => {
                            // Asset might has `unknown` extension and we must force user to fix the extension in the dialogue window.
                            const hasUnknownExtension = asset.extension === "unknown";

                            // The same for asset type.
                            const hasUnknownType = asset.type === "Unknown";

                            let warningText = "";
                            if (hasUnknownExtension) {
                                warningText =
                                    "Could not detect file extension! Please set it manually.";
                                if (hasUnknownType) {
                                    warningText =
                                        "Could not detect file extension and asset type! Please set them manually.";
                                }
                            } else if (hasUnknownType) {
                                warningText =
                                    "Could not detect asset type! Please set it manually.";
                            }

                            return (
                                <ActionableListItem
                                    key={asset.asset.id}
                                    style={
                                        hasUnknownExtension || hasUnknownType
                                            ? {
                                                  backgroundColor:
                                                      "rgba(251, 191, 36, 0.35)",
                                              }
                                            : undefined
                                    }
                                    title={asset.relativePath}
                                    titleSize="sm"
                                    tooltip={asset.asset.url}
                                    leftComponent={
                                        hasUnknownExtension || hasUnknownType ? (
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
                                                <IconAlertOctagonFilled
                                                    size={16}
                                                    style={{ opacity: 0.6 }}
                                                ></IconAlertOctagonFilled>
                                            </div>
                                        ) : (
                                            <IconWorldWww
                                                size={16}
                                                style={{ opacity: 0.6 }}
                                            />
                                        )
                                    }
                                    rightComponent={
                                        <>
                                            <EditActionIcon
                                                onClick={async () => {
                                                    const originalUrl = asset.asset.url;
                                                    const result = await useDialogueStore
                                                        .getState()
                                                        .showDialogue<AddRemoteAssetDialogueReturnType>(
                                                            {
                                                                title: "Edit remote asset",
                                                                width: "800px",
                                                                showCloseButton: true,
                                                                content: (close) => (
                                                                    <AddRemoteAssetDialogueContent
                                                                        url={
                                                                            asset.asset
                                                                                .url
                                                                        }
                                                                        extension={
                                                                            asset.extension ===
                                                                            "unknown"
                                                                                ? undefined
                                                                                : asset.extension
                                                                        }
                                                                        type={asset.type}
                                                                        close={close}
                                                                    />
                                                                ),
                                                            },
                                                        );

                                                    if (result) {
                                                        if (
                                                            result.url &&
                                                            result.url.trim() !== ""
                                                        ) {
                                                            editRemoteAsset(
                                                                originalUrl,
                                                                result.url.trim(),
                                                                result.extension,
                                                                result.type,
                                                            );
                                                        }
                                                    }
                                                }}
                                            ></EditActionIcon>
                                            <DeleteActionIcon
                                                onClick={async () => {
                                                    const result = await useDialogueStore
                                                        .getState()
                                                        .showDialogue<boolean>({
                                                            title: "Delete Confirmation",
                                                            width: "550px",
                                                            showCloseButton: true,
                                                            content: (close) => (
                                                                <DeleteAssetDialogueContent
                                                                    assetName={asset.name}
                                                                    close={close}
                                                                />
                                                            ),
                                                        });

                                                    if (result) {
                                                        removeAsset(asset.asset.url);
                                                    }
                                                }}
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

                {/* Input form to add new remote asset. */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        marginTop:
                            Array.from(assets.values()).filter(isManagedAssetRemote)
                                .length === 0
                                ? "0.5em"
                                : "1em",
                        gap: "0.5em",
                    }}
                >
                    <Button
                        variant="primary"
                        size="medium"
                        onClick={async () => {
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

                            if (result) {
                                if (result.url && result.url.trim() !== "") {
                                    addRemoteAsset(
                                        result.url.trim(),
                                        result.extension,
                                        result.type,
                                    );
                                }
                            }
                        }}
                        tooltip="Add new remote asset."
                    >
                        Add...
                    </Button>
                </div>
            </div>
        </div>
    );
}
