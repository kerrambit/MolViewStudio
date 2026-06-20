import { useNavigate } from "react-router-dom";
import { useWorkspaceManagement } from "../features/workspace/hooks/useWorkspaceManagement";
import { useDialogue } from "./DialogueProvider";
import { MenuProvider } from "./MenuProvider";
import { createInitialMenu } from "../config/createInitialMenu";

interface AppMenuBridgeProps {
    children: React.ReactNode;
}

export function AppMenuBridge({ children }: AppMenuBridgeProps) {
    // Use navigation.
    const navigate = useNavigate();

    // Use dialogue.
    const { showDialogue } = useDialogue();

    // Use workspace management.
    const {
        openFileExplorerAndLoadFileInApp,
        createNewProjectInApp,
        loadRecentFileInApp,
    } = useWorkspaceManagement();

    const initialAppMenu = () =>
        createInitialMenu(
            navigate,
            showDialogue,
            openFileExplorerAndLoadFileInApp,
            createNewProjectInApp,
            loadRecentFileInApp,
        );

    return <MenuProvider initialMenu={initialAppMenu}>{children}</MenuProvider>;
}
