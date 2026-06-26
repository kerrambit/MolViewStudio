import { Text, Divider, MultiSelect } from "@mantine/core";
import { useAppearance } from "../../../../../providers/AppearanceProvider";
import { CloseActionIcon } from "../../../../../components/common/actionables/actions-icons/CloseActionIcon";
import { useViewBuilder } from "../../../hooks/useViewBuilder";
import { AssetBuilderCard } from "./AssetBuilderCard";
import { AutoScrollList } from "../../../../../components/common/auto-scroll-list/AutoScrollList";
import { UiLocalStorageService } from "../../../../../services/UiLocalStorageService";

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
        selectedAssetFilters,
        setSelectedAssetFilters,
        selectedAssetIds,
        expandedAssetId,
        getViewModel,
        toggleExpandAsset,
        updateViewModel,
        handleAssetToggle,
    } = useViewBuilder(props.viewKey);

    // Render nothing if no view was found with given key.
    if (!view) return <></>;

    // Computes index of first selected asset in the list, otherwise -1.
    const firstSelectedAssetIndex = assetsInView.findIndex((asset) =>
        selectedAssetIds.includes(asset.id),
    );

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

            <MultiSelect
                label="Select asset type filters"
                data={[
                    "All",
                    "Local assets",
                    "Remote assets",
                    ".map",
                    ".bcif",
                    ".cif",
                    ".ccp4",
                ]}
                value={selectedAssetFilters}
                onChange={(filters) => {
                    setSelectedAssetFilters(filters);
                    UiLocalStorageService.ViewBuilder.setAssetFilters(
                        props.viewKey,
                        filters,
                    );
                }}
                placeholder="Select asset types you want to use."
                defaultValue={["All"]}
                checkIconPosition="left"
                withAlignedLabels
                clearable
                hidePickedOptions
                searchable
                nothingFoundMessage="No asset found!"
                style={{ paddingBottom: "1em" }}
                styles={{
                    pill: {
                        background:
                            colorScheme === "dark"
                                ? "var(--mantine-primary-color-7)"
                                : "var(--mantine-primary-color-3)",
                    },
                }}
            ></MultiSelect>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5em",
                }}
            >
                <AutoScrollList
                    list={assetsInView}
                    activeIndex={
                        firstSelectedAssetIndex === -1
                            ? 0
                            : firstSelectedAssetIndex
                    }
                    renderItem={(asset, _) => {
                        return (
                            <AssetBuilderCard
                                key={asset.id}
                                asset={asset}
                                isDark={isDark}
                                isExpanded={expandedAssetId === asset.id}
                                isSelected={selectedAssetIds.includes(asset.id)}
                                viewModel={getViewModel(asset.id)}
                                onToggleExpand={() =>
                                    toggleExpandAsset(asset.id)
                                }
                                onToggleSelect={(checked) =>
                                    handleAssetToggle(asset.id, checked)
                                }
                                onUpdateParam={(key, val, sync) =>
                                    updateViewModel(asset.id, key, val, sync)
                                }
                            />
                        );
                    }}
                ></AutoScrollList>
            </div>
        </div>
    );
}
