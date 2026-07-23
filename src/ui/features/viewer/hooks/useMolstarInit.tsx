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
    const [molstarLoading, setMolstarLoading] = useState(true);

    // Controls if the Molstar viewer is expanded or not.
    const [molstarExpanded, setMolstarExpanded] = useState(MOLSTAR_EXPANDED);

    // Use regime.
    const regime = useRegimeStore((state) => state.regime);
    const setRegime = useRegimeStore((state) => state.setRegime);

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
            setMolstarLoading(false);
            fullScreenSubscription = getFullScreenSubscription((val) =>
                setMolstarExpanded(val),
            );
        });

        return () => {
            // Molstar clean-up procedure.
            const runCleanup = async () => {
                // If the current state is "viewing", and the Molstar is about to be destroyed,
                // we have to save the session to be able to later restore it (in the application lifetime).
                if (regimeReference.current.kind === "viewing") {
                    setRegime({
                        ...regimeReference.current,
                        kind: "restoring",
                        session: {
                            snapshot: getMolstarStateSnapshot(),
                            arcpAssets: await serializeMVSXAssets(),
                            snapshotManagerState:
                                await getSnapshotManagerStateSnapshot(),
                        },
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
    }, [setRegime]);

    // Restore the previous workspace.
    useEffect(() => {
        if (molstarLoading || regime.kind !== "restoring") {
            return;
        }

        // Set the regime back to viewing.
        setRegime({
            ...regime,
            kind: "viewing",
        });
    }, [regime, setRegime, molstarLoading]);

    // Start deconstruction of file to view.
    useEffect(() => {
        const deconstruct = async () => {
            if (molstarLoading || regime.kind !== "staging") {
                return;
            }

            await openFileInViewer();
        };

        deconstruct();
    }, [regime, molstarLoading, openFileInViewer]);

    return { parentRef, molstarLoading, molstarExpanded };
}
