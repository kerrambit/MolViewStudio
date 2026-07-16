import { useNavigate } from "react-router-dom";
import { useWorkspaceManagement } from "../../features/workspace/hooks/useWorkspaceManagement";
import { MenuProvider } from "../../providers/MenuProvider";
import { createInitialMenuForMainMenu } from "../../config/createInitialMenuForMainMenu";

interface MainMenuBridgeProps {
    children: React.ReactNode;
}

export function MainMenuBridge({ children }: MainMenuBridgeProps) {
    // Use navigation.
    const navigate = useNavigate();

    // Use workspace management.
    const {
        openFileExplorerAndLoadFileInApp,
        createNewProjectInApp,
        loadRecentFileInApp,
    } = useWorkspaceManagement();

    const initialAppMenu = () =>
        createInitialMenuForMainMenu(
            navigate,
            openFileExplorerAndLoadFileInApp,
            createNewProjectInApp,
            loadRecentFileInApp,
        );

    return <MenuProvider initialMenu={initialAppMenu}>{children}</MenuProvider>;
}
