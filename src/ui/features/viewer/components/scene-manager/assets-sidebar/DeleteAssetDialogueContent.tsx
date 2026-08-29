/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

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
                Are you sure you want to delete the asset{" "}
                <b>{`'${assetName}'`}</b>? This action cannot be undone!
                <br />
                <br />
                Note that undoing later changes could bring back a view that
                used to reference this asset — since the asset itself won't be
                restored, that view would be left with a broken reference.
            </p>

            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "8px",
                }}
            >
                <Button variant={"ghost"} onClick={() => close(false)}>
                    Cancel
                </Button>
                <Button onClick={() => close(true)}>Delete</Button>
            </div>
        </>
    );
}
