import { useNavigate } from "react-router-dom";
import { useWorkspaceManagement } from "../features/workspace/hooks/useWorkspaceManagement";
import { useDialogue } from "./DialogueProvider";
import { MenuProvider } from "./MenuProvider";
import { createInitialMenuForMainMenu } from "../config/createInitialMenuForMainMenu";

interface MainMenuBridgeProps {
    children: React.ReactNode;
}

export function MainMenuBridge({ children }: MainMenuBridgeProps) {
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
        createInitialMenuForMainMenu(
            navigate,
            showDialogue,
            openFileExplorerAndLoadFileInApp,
            createNewProjectInApp,
            loadRecentFileInApp,
        );

    return <MenuProvider initialMenu={initialAppMenu}>{children}</MenuProvider>;
}
