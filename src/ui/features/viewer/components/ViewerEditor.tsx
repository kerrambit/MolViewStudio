import { LoadingOverlay } from "@mantine/core";
import { useMolstarInit } from "../hooks/useMolstarInit";
import { ProcessingJobs } from "./processing-manager/ProcessingJobs";
import { SceneManager } from "./scene-manager/SceneManager";
import { useMolstarTheme } from "../hooks/useMolstarTheme";

import "./ViewerEditor.css";

export function ViewerEditor() {
    // Use Molstar.
    const { parentRef, molstarInitializing, molstarExpanded } =
        useMolstarInit();

    // Use Molstar theme.
    useMolstarTheme();

    // Render the component.
    return (
        <div style={{ position: "relative", display: "flex", height: "100%" }}>
            <LoadingOverlay
                visible={molstarInitializing}
                zIndex={1000}
                overlayProps={{ radius: "sm", blur: 2 }}
                loaderProps={{ type: "oval" }}
            />
            <ProcessingJobs />
            <SceneManager
                isMolstarExpanded={molstarExpanded}
                isMolstarInitializing={molstarInitializing}
            />
            <main style={{ flex: 1, padding: "0.5em" }}>
                <div
                    ref={parentRef}
                    style={{ width: "100%", height: "100%" }}
                />
            </main>
        </div>
    );
}
