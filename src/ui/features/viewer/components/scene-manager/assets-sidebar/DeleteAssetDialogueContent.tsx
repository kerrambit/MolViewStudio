import { Button } from "../../../../../components/common/button/Button";

interface DeleteAssetDialogueContentProps {
    assetName: string;
    close: (value?: boolean) => void;
}

export function DeleteAssetDialogueContent({
    assetName,
    close,
}: DeleteAssetDialogueContentProps) {
    // Render the component.
    return (
        <>
            <p style={{ marginBottom: "1rem" }}>
                {`Do you really want to delete '${assetName}' asset?`}
            </p>

            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "8px",
                }}
            >
                <Button variant={"ghost"} onClick={() => close(true)}>
                    Yes
                </Button>
                <Button onClick={() => close(false)}>Cancel</Button>
            </div>
        </>
    );
}
