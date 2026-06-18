import { LoadingOverlay } from "@mantine/core";
import { useViewerMenu } from "../hooks/useViewerMenu";
import { useMolstarInit } from "../hooks/useMolstarInit";
import { ProcessingJobs } from "./processing-manager/ProcessingJobs";
import { SceneManager } from "./scene-manager/SceneManager";

import "molstar/lib/mol-plugin-ui/skin/light.scss";
import "./ViewerEditor.css";

export function ViewerEditor() {
    // Use viewer menu.
    useViewerMenu();

    // Use Molstar.
    const { parentRef, molstarLoading, molstarExpanded } = useMolstarInit();

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
