/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { Text } from "@mantine/core";
import { LocalAssetsTree } from "./LocalAssetsTree";
import { RemoteAssetsList } from "./RemoteAssetsList";

export function Assets() {
    // Render the component.
    return (
        <div>
            {/* Local assets part. */}
            <div>
                <Text
                    size="xl"
                    mb="sm"
                    title="Navigate with <Up>/<Down>, Expand with <Space>."
                >
                    Local
                </Text>

                <LocalAssetsTree />
            </div>

            {/* Remote assets part. */}
            <div style={{ marginTop: "2em" }}>
                <Text size="xl" mb="sm">
                    Remote
                </Text>

                <RemoteAssetsList />
            </div>
        </div>
    );
}
