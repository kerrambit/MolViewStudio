import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useWorkspaceManagement } from "../../features/workspace/hooks/useWorkspaceManagement";
import { createInitialMenuForViewerPageMenu } from "../../config/createInitialMenuForViewerPageMenu";
import { MenuProvider } from "../../providers/MenuProvider";

interface ViewerPageBridgeProps {
    children: React.ReactNode;
}

export function ViewerPageBridge({ children }: ViewerPageBridgeProps) {
    // Use navigation.
    const navigate = useNavigate();

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
                openFileExplorerAndLoadFileInApp,
                createNewProjectInApp,
                loadRecentFileInApp,
            ),
        [],
    );

    return <MenuProvider initialMenu={initialAppMenu}>{children}</MenuProvider>;
}
