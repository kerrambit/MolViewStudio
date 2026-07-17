import { MenuProvider } from "../../providers/MenuProvider";
import { createInitialMenuForMainMenu } from "../../config/createInitialMenuForMainMenu";

interface MainMenuBridgeProps {
    children: React.ReactNode;
}

export function MainMenuBridge({ children }: MainMenuBridgeProps) {
    return (
        <MenuProvider initialMenu={() => createInitialMenuForMainMenu()}>
            {children}
        </MenuProvider>
    );
}
