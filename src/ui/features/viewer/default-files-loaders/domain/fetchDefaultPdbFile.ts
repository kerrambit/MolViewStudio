/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useRegimeStore } from "../../../regime/stores/regimeStore";

export async function fetchDefaultPdbFile() {
    const response = await fetch("https://files.rcsb.org/download/3PTB.pdb");
    const rawData = await response.text();

    const regime = useRegimeStore.getState().regime;
    if (regime.kind === "idling" || regime.kind === "viewing") {
        regime.stageFile(
            {
                path: "https://files.rcsb.org/download/3PTB.pdb",
                extension: "pdb",
                name: "3PTB.pdb",
                binary: false,
                content: rawData,
            },
            true,
        );
    }
}
