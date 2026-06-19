import type { Regime } from "../../../providers/RegimeProvider";

export async function loadDefaultMVSJFile(setRegime: (regime: Regime) => void) {
    const response = await fetch(
        "https://raw.githubusercontent.com/molstar/molstar/master/examples/mvs/1cbs.mvsj",
    );
    const rawData = await response.text();

    setRegime({
        kind: "staging",
        fileToView: {
            path: "https://raw.githubusercontent.com/molstar/molstar/master/examples/mvs/1cbs.mvsj",
            extension: "mvsj",
            name: "1cbs.mvsj",
            binary: false,
            content: rawData,
        },
    });
}

export async function loadDefaultMVSXFile(setRegime: (regime: Regime) => void) {
    const response = await fetch(
        "https://molstar.org/mol-view-spec-docs/files/1h9t.mvsx",
    );
    const arrayBuffer = await response.arrayBuffer();
    const rawData = new Uint8Array(arrayBuffer);

    setRegime({
        kind: "staging",
        fileToView: {
            path: "https://molstar.org/mol-view-spec-docs/files/1h9t.mvsx",
            extension: "mvsx",
            name: "1h9t.mvsx",
            binary: true,
            content: rawData,
        },
    });
}

export async function loadDefaultPDBFile(setRegime: (regime: Regime) => void) {
    const response = await fetch("https://files.rcsb.org/download/3PTB.pdb");
    const rawData = await response.text();

    setRegime({
        kind: "staging",
        fileToView: {
            path: "https://files.rcsb.org/download/3PTB.pdb",
            extension: "pdb",
            name: "3PTB.pdb",
            binary: false,
            content: rawData,
        },
    });
}
