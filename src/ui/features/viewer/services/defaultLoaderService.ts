/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useRegimeStore } from "../../../stores/regimeStore";

export async function loadDefaultMVSJFile() {
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

export async function loadDefaultMVSXFile() {
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

export async function loadDefaultPDBFile() {
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
