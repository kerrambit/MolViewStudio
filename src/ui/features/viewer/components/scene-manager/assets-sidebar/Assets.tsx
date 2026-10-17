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
import { pushErrorNotification } from "../../../../../services/NotificationService";
import { useWorkspaceManagement } from "../../../../workspace/hooks/useWorkspaceManagement";
import {
    checkRequiresProcessing,
    PREVIEW_DOWNSAMPLING_SIZE_THRESHOLD,
} from "../../../../../config/assetsDefinitions";
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
import {
    getFilenameWithoutExtension,
    getFileSizeInBytes,
} from "../../../../../utils/fileDataUtils";

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

    // Use workspace management.
    const { startFileProcessing } = useWorkspaceManagement();

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
                        onClick={async () => {
                            const result = await useDialogueStore
                                .getState()
                                .showDialogue<AddLocalAssetDialogueReturnType>({
                                    title: "Add local asset",
                                    width: "800px",
                                    showCloseButton: true,
                                    content: (close) => (
                                        <AddLocalAssetDialogueContent close={close} />
                                    ),
                                });

                            if (result) {
                                for (const { file, offersProcessing } of result.files) {
                                    const requiresProcessing = checkRequiresProcessing(
                                        file.extension,
                                    );

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
                                    } else {
                                        // Resolve and store the file mapping (ID -> path) for the newly created asset.
                                        const resolvedPath = await resolveAndStoreMapping(
                                            newAsset.id,
                                            file.path,
                                        );

                                        if (!resolvedPath) {
                                            pushErrorNotification(
                                                `Failed to store file mapping for asset "${result.relativePath}${file.name}"! Export and further processing of this asset may not work.`,
                                            );
                                        }

                                        // Large volume assets which offer processing are automatically downsampled into a preview using the nearest algorithm.
                                        const contentSizeInBytes =
                                            typeof file.content === "string"
                                                ? file.content.length
                                                : file.content.byteLength;
                                        if (
                                            (result.type === "Volume" ||
                                                result.type === "Segmentation") &&
                                            ((offersProcessing &&
                                                contentSizeInBytes >
                                                    PREVIEW_DOWNSAMPLING_SIZE_THRESHOLD) ||
                                                requiresProcessing)
                                        ) {
                                            if (requiresProcessing) {
                                                await startFileProcessing(
                                                    file,
                                                    result.type,
                                                    {
                                                        downsampling_strategy: "nearest",
                                                        volume_serializer: "mrc",
                                                        segmentation_mask_serializer:
                                                            "mrc",
                                                        segmentation_volume_serializer:
                                                            "mrc",
                                                        segmentation_mesh_serializer:
                                                            "mrc",
                                                        bundling_approach: "null",
                                                    },
                                                    newAsset.id,
                                                    (assets: FileData[]) => {
                                                        if (!assets) {
                                                            return [];
                                                        }

                                                        // TODO: use more intelligent using EXPORT_RESOLUTION_TO_INDEX
                                                        const biggestIndex =
                                                            assets.reduce(
                                                                (
                                                                    bestIndex,
                                                                    current,
                                                                    currentIndex,
                                                                ) =>
                                                                    getFileSizeInBytes(
                                                                        current,
                                                                    ) >
                                                                    getFileSizeInBytes(
                                                                        assets[bestIndex],
                                                                    )
                                                                        ? currentIndex
                                                                        : bestIndex,
                                                                0,
                                                            );

                                                        const originalNameWithoutExtension =
                                                            getFilenameWithoutExtension(
                                                                newAsset.name,
                                                            ) ?? newAsset.name;
                                                        const name = `${originalNameWithoutExtension} (Converted).${"mrc"}`;

                                                        return [
                                                            {
                                                                assetIndex: biggestIndex,
                                                                relativePath:
                                                                    result.relativePath,
                                                                name: name,
                                                                hidden: false,
                                                                kind: "NecessaryConversion",
                                                                notify: true,
                                                            },
                                                        ];
                                                    },
                                                );
                                            } else {
                                                await startFileProcessing(
                                                    file,
                                                    result.type,
                                                    {
                                                        downsampling_strategy: "nearest",
                                                        volume_serializer: "mrc",
                                                        segmentation_mask_serializer:
                                                            "mrc",
                                                        segmentation_volume_serializer:
                                                            "mrc",
                                                        segmentation_mesh_serializer:
                                                            "mrc",
                                                        bundling_approach: "null",
                                                    },
                                                    newAsset.id,
                                                    (assets: FileData[]) => {
                                                        if (!assets) {
                                                            return [];
                                                        }

                                                        // TODO: use more intelligent using EXPORT_RESOLUTION_TO_INDEX
                                                        const smallestIndex =
                                                            assets.reduce(
                                                                (
                                                                    bestIndex,
                                                                    current,
                                                                    currentIndex,
                                                                ) =>
                                                                    getFileSizeInBytes(
                                                                        current,
                                                                    ) <
                                                                    getFileSizeInBytes(
                                                                        assets[bestIndex],
                                                                    )
                                                                        ? currentIndex
                                                                        : bestIndex,
                                                                0,
                                                            );

                                                        // Name the preview same as the original file, with a "(Preview quality N)" suffix. N is incremented for each existing preview of the same original.
                                                        const parentAsset = newAsset;
                                                        const previewQualityIndex =
                                                            parentAsset
                                                                ? parentAsset.children
                                                                      .length + 1
                                                                : 1;
                                                        const originalNameWithoutExtension =
                                                            getFilenameWithoutExtension(
                                                                assets[smallestIndex]
                                                                    .name,
                                                            ) ??
                                                            assets[smallestIndex].name;
                                                        const previewName = `${originalNameWithoutExtension} (Preview quality ${previewQualityIndex}).${"mrc"}`;

                                                        return [
                                                            {
                                                                assetIndex: smallestIndex,
                                                                relativePath:
                                                                    result.relativePath,
                                                                name: previewName,
                                                                hidden: true,
                                                                kind: "Preview",
                                                                notify: false,
                                                            },
                                                        ];
                                                    },
                                                );
                                            }
                                        }
                                    }
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
