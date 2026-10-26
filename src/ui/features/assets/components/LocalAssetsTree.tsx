/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useCallback, useMemo, useState } from "react";
import { Text, Group, Tree, useTree, Button } from "@mantine/core";
import { IconFile, IconFolder, IconFolderOpen } from "@tabler/icons-react";
import { DeleteActionIcon } from "../../../components/common/actionables/actions-icons/DeleteActionIcon";
import { EditActionIcon } from "../../../components/common/actionables/actions-icons/EditActionIcon";
import { computeOptimalYellow } from "../../../components/common/actionables/actions-icons/utils/computeOptimalYellow";
import { useAppearance } from "../../../hooks/useAppearance";
import { pushErrorNotification } from "../../../services/NotificationService";
import { UiLocalStorageService } from "../../../services/UiLocalStorageService";
import { useDialogueStore } from "../../../stores/dialogueStore";
import {
    useManagedAssetsStore,
    isManagedAssetLocal,
} from "../../../stores/managedAssetsStore";
import { useRegimeStore } from "../../../stores/regimeStore";
import { buildAssetTree, type AssetTreeNode } from "../../viewer/utils/buildAssetTree";
import { useAddLocalAssets } from "../hooks/useAddLocalAssets";
import {
    type AddLocalAssetDialogueReturnType,
    AddLocalAssetDialogueContent,
} from "./AddLocalAssetDialogueContent";
import { DeleteAssetDialogueContent } from "./DeleteAssetDialogueContent";
import {
    type EditAssetDialogueReturnType,
    EditAssetDialogueContent,
} from "./EditAssetDialogueContent";

type LocalAsset = NonNullable<AssetTreeNode["assetRef"]>;

/**
 * Self-contained tree of local assets, including the info text for the empty state
 * and the button to add new local assets.
 */
export function LocalAssetsTree() {
    // Use appearance.
    const { colorScheme } = useAppearance();

    // Use regime.
    const regime = useRegimeStore((state) => state.regime);
    const viewedFilePath = regime.kind === "viewing" ? regime.viewedFile.path : "";

    // Use managed assets.
    const assets = useManagedAssetsStore((state) => state.assets);
    const removeAsset = useManagedAssetsStore((state) => state.removeAsset);
    const editLocalAsset = useManagedAssetsStore((state) => state.editLocalAsset);

    // Use adding of local assets.
    const { handleAddLocalAssets: handleNewLocalAssets } = useAddLocalAssets();

    // State for the tree.
    const [expandedState, setExpandedState] = useState<Record<string, boolean>>(
        UiLocalStorageService.Assets.getInitialTreeExpandedState(viewedFilePath),
    );

    // Use tree.
    const tree = useTree({
        expandedState,
        onExpandedStateChange: (nextState) => {
            setExpandedState(nextState);
            UiLocalStorageService.Assets.setInitialTreeExpandedState(
                viewedFilePath,
                nextState,
            );
        },
    });

    // Memoize visible local assets. Hidden assets (e.g. previews) are not shown.
    const localAssets = useMemo(
        () =>
            Array.from(assets.values())
                .filter(isManagedAssetLocal)
                .filter((asset) => !asset.hidden),
        [assets],
    );

    const localAssetsTreeData = useMemo(() => buildAssetTree(localAssets), [localAssets]);

    const handleAddLocalAssets = useCallback(async () => {
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

        await handleNewLocalAssets(result);
    }, [handleNewLocalAssets]);

    const handleEditLocalAsset = useCallback(
        async (asset: LocalAsset) => {
            const result = await useDialogueStore
                .getState()
                .showDialogue<EditAssetDialogueReturnType>({
                    title: "Edit local asset",
                    width: "800px",
                    showCloseButton: true,
                    content: (close) => (
                        <EditAssetDialogueContent
                            filename={asset.name}
                            type={asset.type}
                            pathSegments={asset.relativePath
                                .split("/")
                                .filter(Boolean)
                                .slice(0, -1)}
                            close={close}
                        />
                    ),
                });

            if (!result) {
                return;
            }

            const wasSuccessful = editLocalAsset(
                asset.asset.url,
                `${result.newFileName}`,
                `${result.relativePath}`,
                result.type,
            );
            if (!wasSuccessful) {
                pushErrorNotification(
                    `Could not edit "${result.relativePath}${asset.name}" asset!`,
                );
            }
        },
        [editLocalAsset],
    );

    const handleDeleteLocalAsset = useCallback(
        async (asset: LocalAsset) => {
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
            {localAssets.length === 0 ? (
                // Info text if no local assets are found.
                <Text size="sm" c="dimmed" ta="center">
                    No local assets found...
                </Text>
            ) : (
                <div
                    style={{ padding: "0.25em" }}
                    title="Navigate with <Up>/<Down>, Expand with <Space>."
                >
                    <Tree
                        tree={tree}
                        data={localAssetsTreeData}
                        levelOffset={16}
                        expandOnSpace={true}
                        renderNode={({ node, expanded, hasChildren, elementProps }) => {
                            // Data packet of type ManagedAsset (only leaves have it).
                            const asset = (node as AssetTreeNode).assetRef;

                            // Checks if current node is leaf (file) or not (folder).
                            const isFile = !hasChildren && !!asset;

                            const FolderIcon = expanded ? IconFolderOpen : IconFolder;

                            // One branch/leaf (mirrors the style of `ActionableListItem`).
                            return (
                                <Group
                                    {...elementProps}
                                    className={`actionableListItemColor ${
                                        elementProps.className || ""
                                    }`}
                                    justify="space-between"
                                    style={{
                                        ...elementProps.style,
                                        marginBottom: "0.5em",
                                    }}
                                    title={asset?.name}
                                >
                                    {/* Left section. */}
                                    <Group gap="xs">
                                        {hasChildren ? (
                                            <FolderIcon
                                                size={18}
                                                style={{
                                                    color: computeOptimalYellow(
                                                        colorScheme,
                                                    ),
                                                }}
                                            />
                                        ) : (
                                            <IconFile
                                                size={18}
                                                style={{ opacity: 0.6 }}
                                            />
                                        )}

                                        <Text size="sm">{node.label}</Text>
                                    </Group>

                                    {/* If the node is leaf (file), we add the right section with action buttons. */}
                                    {isFile && (
                                        <Group
                                            gap="0.1em"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <EditActionIcon
                                                onClick={() =>
                                                    handleEditLocalAsset(asset)
                                                }
                                                tooltip="Edit local asset."
                                            />
                                            <DeleteActionIcon
                                                onClick={() =>
                                                    handleDeleteLocalAsset(asset)
                                                }
                                                tooltip={
                                                    asset.useCount > 0
                                                        ? "Cannot delete asset, as it is being referenced in view."
                                                        : "Delete local asset."
                                                }
                                                enabled={!(asset.useCount > 0)}
                                            />
                                        </Group>
                                    )}
                                </Group>
                            );
                        }}
                    />
                </div>
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
                    variant="filled"
                    size="sm"
                    onClick={handleAddLocalAssets}
                    title="Open dialogue to add new local asset."
                    leftSection={<IconFile size={16} />}
                >
                    Add...
                </Button>
            </div>
        </div>
    );
}
