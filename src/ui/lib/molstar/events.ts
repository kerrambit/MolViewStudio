/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { Color } from "molstar/lib/mol-util/color";
import { getMolstar } from "./instance";
import { PluginStateSnapshotManager } from "molstar/lib/mol-plugin-state/manager/snapshots";

/**
 * Creates a subscription to the event: Molstar layout is expanded.
 * @param callback event to run
 * @warning Take care of the unsubscription.
 * @returns `Subscription` object
 */
export function getFullScreenSubscription(
    callback: (isExpanded: boolean) => void,
) {
    const molstar = getMolstar();

    const sub = molstar.layout.events.updated.subscribe(() => {
        if (!molstar) return;

        const isFullscreen = molstar.layout.state.isExpanded;
        callback(isFullscreen);
    });

    return sub;
}

/**
 * Creates a subscription to the event: background color changes.
 * @param callback event to run
 * @warning Take care of the unsubscription.
 * @returns `Subscription` object
 */
export function getBackgroundColorChangeSubscription(
    callback: (color: Color | undefined) => void,
) {
    const molstar = getMolstar();

    const sub = molstar.events.canvas3d.settingsUpdated.subscribe(() => {
        if (!molstar) return;
        const currentColor = molstar.canvas3d?.props.renderer.backgroundColor;
        callback(currentColor);
    });

    return sub;
}

/**
 * Creates a subscription to the event: current snapshot is changed by the user in Molstar UI.
 * @param callback event to run
 * @warning Take care of the unsubscription.
 * @returns `Subscription` object
 */
export function getSnapshotChangeSubscription(
    callback: (
        currentSnapshotIndex: number,
        entry: PluginStateSnapshotManager.Entry,
    ) => void,
) {
    const molstar = getMolstar();

    const subscription = molstar.managers.snapshot.events.changed.subscribe(
        () => {
            if (!molstar) return;
            const current = molstar.managers.snapshot.state.current;

            if (current) {
                const entries = molstar.managers.snapshot.state.entries;
                let currentIndex;

                for (let i = 0; i < entries.count(); i++) {
                    const entry = entries.get(i);
                    if (entry?.snapshot?.id === current) {
                        currentIndex = i;
                        callback(currentIndex, entry);
                        break;
                    }
                }
            }
        },
    );

    return subscription;
}
