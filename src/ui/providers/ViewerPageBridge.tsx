import { useNavigate } from "react-router-dom";
import { useWorkspaceManagement } from "../features/workspace/hooks/useWorkspaceManagement";
import { useDialogue } from "./DialogueProvider";
import { MenuProvider } from "./MenuProvider";
import { createInitialMenuForViewerPageMenu } from "../config/createInitialMenuForViewerPageMenu";
import { useRegime } from "./RegimeProvider";
import { useManagedAssets } from "./ManagedAssetsProvider";
import { useMemo } from "react";

interface ViewerPageBridgeProps {
    children: React.ReactNode;
}

export function ViewerPageBridge({ children }: ViewerPageBridgeProps) {
    // Use navigation.
    const navigate = useNavigate();

    // Use regime,
    const { regime, setRegime } = useRegime();

    // Use managed assets.
    const { clearAssets, getAllAssets, getAllLocalAssets } = useManagedAssets();

    // Use dialogue.
    const { showDialogue } = useDialogue();

    // Use workspace management.
    const {
        openFileExplorerAndLoadFileInApp,
        createNewProjectInApp,
        loadRecentFileInApp,
    } = useWorkspaceManagement();

    const initialAppMenu = useMemo(
        () =>
            createInitialMenuForViewerPageMenu(
                navigate,
                showDialogue,
                openFileExplorerAndLoadFileInApp,
                createNewProjectInApp,
                loadRecentFileInApp,
                clearAssets,
                getAllAssets,
                getAllLocalAssets,
                regime,
                setRegime,
            ),
        [],
    );

    return <MenuProvider initialMenu={initialAppMenu}>{children}</MenuProvider>;
}
