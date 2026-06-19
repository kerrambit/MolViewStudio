import { Text, Divider } from "@mantine/core";
import { useAppearance } from "../../../../../providers/AppearanceProvider";
import { CloseActionIcon } from "../../../../../components/common/actionables/actions-icons/CloseActionIcon";
import { useViewBuilder } from "../../../hooks/useViewBuilder";
import { AssetBuilderCard } from "./AssetBuilderCard";

interface ViewBuilderProps {
    viewKey: string;
    onClose?: () => void;
}

export function ViewBuilder(props: ViewBuilderProps) {
    // Use apperance.
    const { colorScheme } = useAppearance();
    const isDark = colorScheme === "dark";

    // Use view builder.
    const {
        view,
        assetsInView,
        selectedAssetIds,
        expandedAssetId,
        getViewModel,
        toggleExpandAsset,
        updateViewModel,
        handleAssetToggle,
    } = useViewBuilder(props.viewKey);

    // Render nothing if no view was found with given key.
    if (!view) return <></>;

    // Render the component.
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                padding: "0.5em",
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: "1em",
                }}
            >
                <div>
                    <Text size="xl" fw={520}>
                        View Builder
                    </Text>
                    <Text size="sm" c="dimmed">
                        Editing: {view.metadata.title || "untitled"}
                    </Text>
                </div>
                <CloseActionIcon
                    onClick={() => {
                        if (props.onClose) {
                            props.onClose();
                        }
                    }}
                    tooltip="Close View Builder sidebar."
                />
            </div>

            <Divider style={{ paddingBottom: "1em" }} />

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5em",
                }}
            >
                {assetsInView.map((asset) => (
                    <AssetBuilderCard
                        key={asset.id}
                        asset={asset}
                        isDark={isDark}
                        isExpanded={expandedAssetId === asset.id}
                        isSelected={selectedAssetIds.includes(asset.id)}
                        viewModel={getViewModel(asset.id)}
                        onToggleExpand={() => toggleExpandAsset(asset.id)}
                        onToggleSelect={(checked) =>
                            handleAssetToggle(asset.id, checked)
                        }
                        onUpdateParam={(key, val, sync) =>
                            updateViewModel(asset.id, key, val, sync)
                        }
                    />
                ))}
            </div>
        </div>
    );
}
