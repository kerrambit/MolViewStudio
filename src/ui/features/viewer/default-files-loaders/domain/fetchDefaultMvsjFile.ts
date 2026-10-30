/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useRegimeStore } from "../../../regime/stores/regimeStore";

export async function fetchDefaultMvsjFile() {
    const response = await fetch(
        "https://raw.githubusercontent.com/molstar/molstar/master/examples/mvs/1cbs.mvsj",
    );
    const rawData = await response.text();

    const regime = useRegimeStore.getState().regime;
    if (regime.kind === "idling" || regime.kind === "viewing") {
        regime.stageFile(
            {
                path: "https://raw.githubusercontent.com/molstar/molstar/master/examples/mvs/1cbs.mvsj",
                extension: "mvsj",
                name: "1cbs.mvsj",
                binary: false,
                content: rawData,
            },
            true,
        );
    }
}
