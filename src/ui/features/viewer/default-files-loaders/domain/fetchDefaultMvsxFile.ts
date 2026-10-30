/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useRegimeStore } from "../../../regime/stores/regimeStore";

export async function fetchDefaultMvsxFile() {
    const response = await fetch(
        "https://molstar.org/mol-view-spec-docs/files/1h9t.mvsx",
    );
    const arrayBuffer = await response.arrayBuffer();
    const rawData = new Uint8Array(arrayBuffer);

    const regime = useRegimeStore.getState().regime;
    if (regime.kind === "idling" || regime.kind === "viewing") {
        regime.stageFile(
            {
                path: "https://molstar.org/mol-view-spec-docs/files/1h9t.mvsx",
                extension: "mvsx",
                name: "1h9t.mvsx",
                binary: true,
                content: rawData,
            },
            true,
        );
    }
}
