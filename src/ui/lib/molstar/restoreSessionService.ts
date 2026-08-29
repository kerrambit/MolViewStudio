/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { getMolstar } from "./instance";
import { type SerializedAssets, type Session } from "./types";

/**
 * Re-registers previously serialized MVSX assets into the asset manager of the new plugin instance. Call this before `setSnapshot`.
 * @param serialized serialized assets as returned by `serializeMVSXAssets`
 */
export function restoreMVSXAssets(serialized: SerializedAssets) {
    const molstar = getMolstar();

    for (const entry of serialized.entries) {
        const file = new File([entry.data.buffer as ArrayBuffer], "raw-data");

        // Re-use the exact same asset id and url so the snapshot's arcp:// references resolve to these entries.
        molstar.managers.asset.set(entry.asset, file, {
            tag: "mvsx-file",
            isStatic: entry.isStatic,
        });
    }
}

/**
 * Restores the previously stored sessions.
 *
 * @param session session data
 */
export async function restoreSessionState(session: Session) {
    const molstar = getMolstar();

    restoreMVSXAssets(session.assets);

    await molstar.managers.snapshot.setStateSnapshot(
        session.snapshotManagerState,
    );

    await molstar.state.setSnapshot(session.snapshot);
}
