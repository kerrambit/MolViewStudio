import { useEffect, useRef, useState } from "react";
import type { Subscription } from "rxjs";
import { useWorkspaceManagement } from "../../workspace/hooks/useWorkspaceManagement";
import {
    initMolstar,
    getFullScreenSubscription,
    getMolstarStateSnapshot,
    serializeMVSXAssets,
    getSnapshotManagerStateSnapshot,
    clearViewer,
    disposeMolstar,
} from "../../../lib/molstar";
import { useRegimeStore } from "../../../stores/regimeStore";

const MOLSTAR_SHOW_CONTROLS = true;
const MOLSTAR_EXPANDED = false;

export function useMolstarInit() {
    // HTML element where we will insert Molstar's viewer.
    const parentRef = useRef<HTMLDivElement>(null);

    // Controls if Molstar is still in the initialization process.
    const [molstarInitializing, setMolstarInitializing] = useState(true);

    // Controls if the Molstar viewer is expanded or not.
    const [molstarExpanded, setMolstarExpanded] = useState(MOLSTAR_EXPANDED);

    // Use regime.
    const regime = useRegimeStore((state) => state.regime);

    // Use workspace management.
    const { openFileInViewer } = useWorkspaceManagement();

    // Use regime to control the current regime of the application.
    const regimeReference = useRef(regime);
    useEffect(() => {
        regimeReference.current = regime;
    });

    // Handle core Molstar setup and destruction.
    useEffect(() => {
        // Subscriptions.
        let fullScreenSubscription: Subscription;

        // Call initializing function.
        initMolstar(
            parentRef.current as HTMLDivElement,
            {
                showControls: MOLSTAR_SHOW_CONTROLS,
                isExpanded: MOLSTAR_EXPANDED,
            },
            // If the regime is in "restoring" state, we will supply the initializator the snapshots, assets to fully restore the session.
            regimeReference.current.kind === "restoring"
                ? {
                      snapshot: regimeReference.current.session.snapshot,
                      assets: regimeReference.current.session.arcpAssets,
                      snapshotManagerState:
                          regimeReference.current.session.snapshotManagerState,
                  }
                : null,
        ).then(() => {
            // Molstar is fully initialized.
            setMolstarInitializing(false);
            fullScreenSubscription = getFullScreenSubscription((val) =>
                setMolstarExpanded(val),
            );
        });

        return () => {
            // Molstar clean-up procedure.
            const runCleanup = async () => {
                // If the current state is "viewing", and the Molstar is about to be destroyed,
                // we have to save the session to be able to later restore it (in the application lifetime).
                const regime = regimeReference.current;
                if (regime.kind === "viewing") {
                    regime.suspend({
                        snapshot: getMolstarStateSnapshot(),
                        arcpAssets: await serializeMVSXAssets(),
                        snapshotManagerState:
                            await getSnapshotManagerStateSnapshot(),
                    });
                }
                clearViewer();
                fullScreenSubscription?.unsubscribe();
                disposeMolstar();
            };

            // Run async clean-up procedure.
            runCleanup().catch(() => {
                clearViewer();
                fullScreenSubscription?.unsubscribe();
                disposeMolstar();
            });
        };
    }, []);

    // Restore the previous workspace.
    useEffect(() => {
        if (molstarInitializing || regime.kind !== "restoring") {
            return;
        }

        regime.resume();
    }, [regime, molstarInitializing]);

    // Start deconstruction of file to view.
    useEffect(() => {
        const deconstruct = async () => {
            if (molstarInitializing || regime.kind !== "staging") {
                return;
            }

            await openFileInViewer(regime.stagedAsFile);
        };

        deconstruct();
    }, [regime, molstarInitializing, openFileInViewer]);

    return { parentRef, molstarInitializing, molstarExpanded };
}
