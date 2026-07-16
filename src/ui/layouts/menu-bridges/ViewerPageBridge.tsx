import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useRegime } from "../../providers/RegimeProvider";
import { useManagedAssets } from "../../providers/ManagedAssetsProvider";
import { useDialogue } from "../../providers/DialogueProvider";
import { useWorkspaceManagement } from "../../features/workspace/hooks/useWorkspaceManagement";
import { createInitialMenuForViewerPageMenu } from "../../config/createInitialMenuForViewerPageMenu";
import { MenuProvider } from "../../providers/MenuProvider";

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
