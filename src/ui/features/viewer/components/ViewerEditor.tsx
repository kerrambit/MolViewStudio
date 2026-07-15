import { LoadingOverlay } from "@mantine/core";
import { useMolstarInit } from "../hooks/useMolstarInit";
import { ProcessingJobs } from "./processing-manager/ProcessingJobs";
import { SceneManager } from "./scene-manager/SceneManager";

import "./ViewerEditor.css";
import { useMolstarTheme } from "../hooks/useMolstarTheme";

export function ViewerEditor() {
    // Use Molstar.
    const { parentRef, molstarLoading, molstarExpanded } = useMolstarInit();

    // Use Molstar theme.
    useMolstarTheme();

    // Render the component.
    return (
        <div style={{ position: "relative", display: "flex", height: "100%" }}>
            <LoadingOverlay
                visible={molstarLoading}
                zIndex={1000}
                overlayProps={{ radius: "sm", blur: 2 }}
                loaderProps={{ type: "oval" }}
            />
            <ProcessingJobs />
            <SceneManager
                isMolstarExpanded={molstarExpanded}
                isMolstarLoading={molstarLoading}
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
